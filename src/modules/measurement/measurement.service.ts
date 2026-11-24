import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getGarment } from "./measurement.templates.js";
import type {
  ClientInput,
  CreateMeasurementInput,
  ListClientsQuery,
  ListMeasurementsQuery,
  UpdateClientInput,
  UpdateMeasurementInput,
} from "./measurement.validation.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const CLIENT_SELECT = { id: true, name: true, phone: true, gender: true } as const;

async function requireSellerId(userId: string) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw ApiError.badRequest("Set up your storefront before recording measurements");
  return profile.id;
}

async function findOwnedClient(sellerId: string, clientId: string) {
  const client = await prisma.measurementClient.findFirst({ where: { id: clientId, sellerId } });
  if (!client) throw ApiError.notFound("Client not found");
  return client;
}

async function findOwnedMeasurement(sellerId: string, id: string) {
  const measurement = await prisma.measurement.findFirst({
    where: { id, sellerId },
    include: { client: { select: CLIENT_SELECT } },
  });
  if (!measurement) throw ApiError.notFound("Measurement not found");
  return measurement;
}

// Only fields the chosen garment uses are allowed, and at least one is needed.
function checkValues(gender: "MALE" | "FEMALE", garmentType: string, values: Record<string, number>) {
  const garment = getGarment(gender, garmentType);
  if (!garment) throw ApiError.badRequest("That outfit type isn't available for this client");
  const unknown = Object.keys(values).filter((k) => !garment.fields.includes(k));
  if (unknown.length) throw ApiError.badRequest(`Unknown measurement for ${garment.label}: ${unknown.join(", ")}`);
  if (Object.keys(values).length === 0) throw ApiError.badRequest("Enter at least one measurement");
}

const searchWhere = (search: string | undefined): Prisma.MeasurementClientWhereInput =>
  search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] }
    : {};

// ---------- clients ----------

export async function listClients(userId: string, query: ListClientsQuery) {
  const sellerId = await requireSellerId(userId);
  const clients = await prisma.measurementClient.findMany({
    where: { sellerId, ...searchWhere(query.search), ...(query.gender && { gender: query.gender }) },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { measurements: true } },
      measurements: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, garmentType: true } },
    },
  });
  return clients.map(({ _count, measurements, ...client }) => ({
    ...client,
    measurementCount: _count.measurements,
    lastMeasuredAt: measurements[0]?.createdAt ?? null,
    lastGarmentType: measurements[0]?.garmentType ?? null,
  }));
}

export async function createClient(userId: string, input: ClientInput) {
  const sellerId = await requireSellerId(userId);
  return prisma.measurementClient.create({
    data: {
      sellerId,
      name: input.name,
      gender: input.gender,
      phone: input.phone || null,
      notes: input.notes || null,
    },
  });
}

export async function getClient(userId: string, clientId: string) {
  const sellerId = await requireSellerId(userId);
  await findOwnedClient(sellerId, clientId);
  return prisma.measurementClient.findUniqueOrThrow({
    where: { id: clientId },
    include: { measurements: { orderBy: { createdAt: "desc" } } },
  });
}

export async function updateClient(userId: string, clientId: string, input: UpdateClientInput) {
  const sellerId = await requireSellerId(userId);
  const client = await findOwnedClient(sellerId, clientId);
  if (input.gender && input.gender !== client.gender) {
    const count = await prisma.measurement.count({ where: { clientId } });
    if (count > 0) throw ApiError.badRequest("Can't change gender for a client who already has measurements");
  }
  return prisma.measurementClient.update({
    where: { id: clientId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });
}

export async function deleteClient(userId: string, clientId: string) {
  const sellerId = await requireSellerId(userId);
  await findOwnedClient(sellerId, clientId);
  await prisma.measurementClient.delete({ where: { id: clientId } });
}

// ---------- measurements ----------

export async function listMeasurements(userId: string, query: ListMeasurementsQuery) {
  const sellerId = await requireSellerId(userId);
  return prisma.measurement.findMany({
    where: {
      sellerId,
      ...(query.garmentType && { garmentType: query.garmentType }),
      ...(query.clientId && { clientId: query.clientId }),
      client: { ...searchWhere(query.search), ...(query.gender && { gender: query.gender }) },
    },
    orderBy: { createdAt: "desc" },
    include: { client: { select: CLIENT_SELECT } },
  });
}

export async function getMeasurement(userId: string, id: string) {
  const sellerId = await requireSellerId(userId);
  return findOwnedMeasurement(sellerId, id);
}

export async function createMeasurement(userId: string, input: CreateMeasurementInput) {
  const sellerId = await requireSellerId(userId);
  const gender = input.clientId
    ? (await findOwnedClient(sellerId, input.clientId)).gender
    : input.client!.gender;
  checkValues(gender, input.garmentType, input.values);

  return prisma.$transaction(async (tx) => {
    const clientId =
      input.clientId ??
      (
        await tx.measurementClient.create({
          data: {
            sellerId,
            name: input.client!.name,
            gender: input.client!.gender,
            phone: input.client!.phone || null,
            notes: input.client!.notes || null,
          },
        })
      ).id;

    // Bump the client so recently measured clients sort first.
    await tx.measurementClient.update({ where: { id: clientId }, data: { updatedAt: new Date() } });

    return tx.measurement.create({
      data: {
        sellerId,
        clientId,
        garmentType: input.garmentType,
        values: input.values,
        unit: input.unit ?? "INCH",
        fit: input.fit ?? "REGULAR",
        occasion: input.occasion || null,
        dueDate: input.dueDate ?? null,
        notes: input.notes || null,
      },
      include: { client: { select: CLIENT_SELECT } },
    });
  });
}

export async function updateMeasurement(userId: string, id: string, input: UpdateMeasurementInput) {
  const sellerId = await requireSellerId(userId);
  const existing = await findOwnedMeasurement(sellerId, id);
  if (input.garmentType !== undefined || input.values !== undefined) {
    checkValues(
      existing.client.gender,
      input.garmentType ?? existing.garmentType,
      input.values ?? (existing.values as Record<string, number>)
    );
  }
  return prisma.measurement.update({
    where: { id },
    data: {
      ...(input.garmentType !== undefined && { garmentType: input.garmentType }),
      ...(input.values !== undefined && { values: input.values }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.fit !== undefined && { fit: input.fit }),
      ...(input.occasion !== undefined && { occasion: input.occasion || null }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
    include: { client: { select: CLIENT_SELECT } },
  });
}

export async function deleteMeasurement(userId: string, id: string) {
  const sellerId = await requireSellerId(userId);
  await findOwnedMeasurement(sellerId, id);
  await prisma.measurement.delete({ where: { id } });
}

// Numbers for the top of the measurements dashboard.
export async function getStats(userId: string) {
  const sellerId = await requireSellerId(userId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAhead = new Date(startOfToday.getTime() + 8 * DAY_MS);

  const [totalClients, totalMeasurements, thisMonth, dueSoon, overdue, byGarment] = await Promise.all([
    prisma.measurementClient.count({ where: { sellerId } }),
    prisma.measurement.count({ where: { sellerId } }),
    prisma.measurement.count({ where: { sellerId, createdAt: { gte: startOfMonth } } }),
    prisma.measurement.findMany({
      where: { sellerId, dueDate: { gte: startOfToday, lt: weekAhead } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { client: { select: CLIENT_SELECT } },
    }),
    prisma.measurement.count({ where: { sellerId, dueDate: { lt: startOfToday, gte: new Date(startOfToday.getTime() - 30 * DAY_MS) } } }),
    prisma.measurement.groupBy({ by: ["garmentType"], where: { sellerId }, _count: { _all: true } }),
  ]);

  return {
    totalClients,
    totalMeasurements,
    thisMonth,
    overdueLast30Days: overdue,
    dueSoon,
    byGarment: byGarment
      .map((g) => ({ garmentType: g.garmentType, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
  };
}
