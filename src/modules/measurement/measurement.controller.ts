import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as service from "./measurement.service.js";
import { getTemplates } from "./measurement.templates.js";
import { listClientsQuerySchema, listMeasurementsQuerySchema } from "./measurement.validation.js";
import type {
  ClientInput,
  CreateMeasurementInput,
  UpdateClientInput,
  UpdateMeasurementInput,
} from "./measurement.validation.js";

const uid = (req: Request) => req.user!.sub;
const id = (req: Request) => req.params.id as string;

export const templatesHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { message: "Measurement templates fetched successfully", data: getTemplates() });
});

export const statsHandler = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { message: "Measurement stats fetched successfully", data: await service.getStats(uid(req)) });
});

// Query parsed here: Express 5 makes req.query read-only.
export const listClientsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.listClients(uid(req), listClientsQuerySchema.parse(req.query));
  sendSuccess(res, { message: "Clients fetched successfully", data });
});

export const createClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createClient(uid(req), req.body as ClientInput);
  sendSuccess(res, { statusCode: 201, message: "Client added successfully", data });
});

export const getClientHandler = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { message: "Client fetched successfully", data: await service.getClient(uid(req), id(req)) });
});

export const updateClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateClient(uid(req), id(req), req.body as UpdateClientInput);
  sendSuccess(res, { message: "Client updated successfully", data });
});

export const deleteClientHandler = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteClient(uid(req), id(req));
  sendSuccess(res, { message: "Client deleted successfully" });
});

export const listMeasurementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.listMeasurements(uid(req), listMeasurementsQuerySchema.parse(req.query));
  sendSuccess(res, { message: "Measurements fetched successfully", data });
});

export const createMeasurementHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createMeasurement(uid(req), req.body as CreateMeasurementInput);
  sendSuccess(res, { statusCode: 201, message: "Measurement saved successfully", data });
});

export const getMeasurementHandler = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { message: "Measurement fetched successfully", data: await service.getMeasurement(uid(req), id(req)) });
});

export const updateMeasurementHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateMeasurement(uid(req), id(req), req.body as UpdateMeasurementInput);
  sendSuccess(res, { message: "Measurement updated successfully", data });
});

export const deleteMeasurementHandler = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteMeasurement(uid(req), id(req));
  sendSuccess(res, { message: "Measurement deleted successfully" });
});
