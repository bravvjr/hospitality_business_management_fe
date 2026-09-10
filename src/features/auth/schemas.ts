import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  tenant_name: z
    .string()
    .min(1, "Business name is required")
    .max(200, "Business name is too long"),
  base_currency: z
    .string()
    .length(3, "Use a 3-letter currency code")
    .transform((value) => value.toUpperCase()),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
