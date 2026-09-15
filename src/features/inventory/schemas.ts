import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  base_unit_id: z.string().min(1, "Base unit is required"),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  reorder_level_base: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d+(\.\d+)?$/.test(value),
      "Enter a valid reorder level",
    ),
  unit_price_major: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d+(\.\d{1,2})?$/.test(value),
      "Enter a valid price (e.g. 150 or 150.50)",
    ),
  currency: z.string().max(3).optional(),
  unit_cost_major: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d+(\.\d{1,2})?$/.test(value),
      "Enter a valid cost (e.g. 50 or 50.00)",
    ),
  cost_currency: z.string().max(3).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  reorder_level_base: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d+(\.\d+)?$/.test(value),
      "Enter a valid reorder level",
    ),
  unit_cost_major: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\d+(\.\d{1,2})?$/.test(value),
      "Enter a valid cost (e.g. 50 or 50.00)",
    ),
  cost_currency: z.string().max(3).optional(),
});

export type ProductEditFormValues = z.infer<typeof productEditSchema>;

export const productUnitFormSchema = z.object({
  unit_id: z.string().min(1, "Unit is required"),
  to_base_factor: z
    .string()
    .min(1, "Conversion factor is required")
    .refine((value) => /^\d+(\.\d+)?$/.test(value) && Number(value) > 0, {
      message: "Enter a positive conversion factor",
    }),
});

export type ProductUnitFormValues = z.infer<typeof productUnitFormSchema>;

export const stockMovementFormSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((value) => /^\d+(\.\d+)?$/.test(value) && Number(value) > 0, {
      message: "Quantity must be greater than zero",
    }),
  unit_id: z.string().min(1, "Unit is required"),
  reason: z.string().min(1, "Reason is required").max(50),
  note: z.string().max(2000).optional(),
});

export type StockMovementFormValues = z.infer<typeof stockMovementFormSchema>;

export const stockAdjustmentFormSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((value) => /^-?\d+(\.\d+)?$/.test(value) && Number(value) !== 0, {
      message: "Enter a non-zero signed quantity",
    }),
  unit_id: z.string().min(1, "Unit is required"),
  reason: z.string().min(1, "Reason is required").max(50),
  note: z.string().max(2000).optional(),
});

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>;
