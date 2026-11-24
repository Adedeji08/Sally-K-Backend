import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE"], { error: "Choose male or female" });
const phoneSchema = z.string().trim().max(30, "Phone number is too long");
const notesSchema = z.string().trim().max(1000, "Notes must be at most 1000 characters");

export const clientSchema = z.object({
  name: z.string({ error: "Client name is required" }).trim().min(2, "Client name is required").max(100),
  phone: phoneSchema.optional(),
  gender: genderSchema,
  notes: notesSchema.optional(),
});

export const updateClientSchema = clientSchema.partial();

const valuesSchema = z.record(
  z.string(),
  z.coerce.number({ error: "Measurements must be numbers" }).positive("Measurements must be above 0").max(500, "That measurement looks too large")
);

const measurementFields = {
  garmentType: z.string({ error: "Choose what you're making" }).trim().min(1, "Choose what you're making"),
  unit: z.enum(["INCH", "CM"]).optional(),
  fit: z.enum(["SLIM", "REGULAR", "LOOSE"]).optional(),
  values: valuesSchema,
  occasion: z.string().trim().max(60).optional(),
  dueDate: z.coerce.date({ error: "Invalid due date" }).nullable().optional(),
  notes: notesSchema.optional(),
};

// Either an existing clientId or a new client created inline.
export const createMeasurementSchema = z
  .object({
    clientId: z.string().uuid("Invalid client id").optional(),
    client: clientSchema.optional(),
    ...measurementFields,
  })
  .refine((d) => Boolean(d.clientId) !== Boolean(d.client), {
    message: "Pick an existing client or add a new one",
    path: ["clientId"],
  });

export const updateMeasurementSchema = z.object(measurementFields).partial();

export const listClientsQuerySchema = z.object({
  search: z.string().trim().optional(),
  gender: genderSchema.optional(),
});

export const listMeasurementsQuerySchema = z.object({
  search: z.string().trim().optional(),
  gender: genderSchema.optional(),
  garmentType: z.string().trim().optional(),
  clientId: z.string().uuid().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type ListMeasurementsQuery = z.infer<typeof listMeasurementsQuerySchema>;
