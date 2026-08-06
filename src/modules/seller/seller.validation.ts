import { z } from "zod";

export const storeSetupSchema = z.object({
  brandName: z
    .string({ error: "Brand / store name is required" })
    .trim()
    .min(2, "Brand name must be at least 2 characters")
    .max(120, "Brand name must be at most 120 characters"),
  category: z.enum(["dresses", "tops", "men", "shoes", "bags", "accessories", "mixed"], {
    error: "Select a valid category",
  }),
  bio: z
    .string({ error: "Brand bio is required" })
    .trim()
    .min(10, "Tell shoppers a bit more about your brand (min 10 characters)")
    .max(1000, "Brand bio must be at most 1000 characters"),
});

const idTypeSchema = z.enum(["nin", "bvn", "passport"], { error: "Select a valid ID type" });

export const verificationSchema = z
  .object({
    businessName: z
      .string({ error: "Registered / trading name is required" })
      .trim()
      .min(2, "Business name must be at least 2 characters")
      .max(150, "Business name must be at most 150 characters"),
    idType: idTypeSchema,
    idNumber: z
      .string({ error: "ID number is required" })
      .trim()
      .min(1, "ID number is required"),
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
