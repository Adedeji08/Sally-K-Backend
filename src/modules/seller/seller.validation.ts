import { z } from "zod";

const categoryEnum = z.enum(["dresses", "tops", "men", "shoes", "bags", "accessories", "mixed"], {
  error: "Select a valid category",
});

const urlSchema = z.string().trim().url("Enter a valid URL");

export const storeSetupSchema = z.object({
  brandName: z
    .string({ error: "Brand / store name is required" })
    .trim()
    .min(2, "Brand name must be at least 2 characters")
    .max(120, "Brand name must be at most 120 characters"),
  categories: z.array(categoryEnum).min(1, "Select at least one category"),
  bio: z
    .string({ error: "Brand bio is required" })
    .trim()
    .min(10, "Tell shoppers a bit more about your brand (min 10 characters)")
    .max(1000, "Brand bio must be at most 1000 characters"),
  logoUrl: urlSchema.optional(),
  instagramUrl: urlSchema.optional(),
  facebookUrl: urlSchema.optional(),
});

const idTypeSchema = z.enum(["nin", "bvn", "passport"], { error: "Select a valid ID type" });

export const verificationSchema = z
  .object({
    idType: idTypeSchema,
    idNumber: z
      .string({ error: "ID number is required" })
      .trim()
      .min(1, "ID number is required"),
    idDocumentUrl: urlSchema.optional(),
    businessType: z
      .string()
      .trim()
      .min(2, "Business type must be at least 2 characters")
      .max(100, "Business type must be at most 100 characters")
      .optional(),
    businessRegistrationNumber: z.string().trim().min(1, "Business registration number cannot be empty").optional(),
    businessDocumentUrl: urlSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const value = data.idNumber;

    if ((data.idType === "nin" || data.idType === "bvn") && !/^\d{11}$/.test(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["idNumber"],
        message: `${data.idType.toUpperCase()} must be exactly 11 digits`,
      });
    }

    if (data.idType === "passport" && !/^[A-Za-z][0-9]{8}$/.test(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["idNumber"],
        message: "Passport number must be 1 letter followed by 8 digits (e.g. A12345678)",
      });
    }
  });

export type StoreSetupInput = z.infer<typeof storeSetupSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
