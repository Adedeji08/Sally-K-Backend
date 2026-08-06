import { z } from "zod";

export const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const signupSchema = z
  .object({
    full_name: z
      .string({ error: "Full name is required" })
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be at most 100 characters")
      .regex(/^[a-zA-Z\s.'-]+$/, "Full name contains invalid characters"),
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string({ error: "Please confirm your password" }),
    role: z.enum(["shopper", "seller"], { error: "Role must be either 'shopper' or 'seller'" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string({ error: "Reset token is required" }).min(1, "Reset token is required"),
    password: passwordSchema,
    confirm_password: z.string({ error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string({ error: "Verification code is required" })
    .trim()
    .length(4, "Code must be 4 digits")
    .regex(/^\d{4}$/, "Code must be numeric"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;


