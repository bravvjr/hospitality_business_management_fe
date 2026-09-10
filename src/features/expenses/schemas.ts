import { z } from "zod";

export const expenseFormSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount_major: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0, {
      message: "Enter a valid amount greater than zero",
    }),
  currency: z.string().length(3, "Use a 3-letter currency code"),
  description: z.string().min(1, "Description is required").max(500),
  expense_date: z.string().min(1, "Date is required"),
  note: z.string().max(500).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
