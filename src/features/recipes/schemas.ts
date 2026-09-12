import { z } from "zod";

const quantitySchema = z
  .string()
  .min(1, "Quantity is required")
  .refine((value) => /^\d+(\.\d+)?$/.test(value) && Number(value) > 0, {
    message: "Enter a positive number",
  });

export const recipeCreateSchema = z.object({
  product_id: z.string().min(1, "Meal product is required"),
  yields_quantity: quantitySchema,
  notes: z.string().max(2000).optional(),
});

export type RecipeCreateFormValues = z.infer<typeof recipeCreateSchema>;

export const recipeIngredientLineSchema = z.object({
  ingredient_product_id: z.string().min(1, "Ingredient is required"),
  quantity: quantitySchema,
});

export type RecipeIngredientLineValues = z.infer<typeof recipeIngredientLineSchema>;

export const recipeItemSchema = z.object({
  quantity: quantitySchema,
});

export type RecipeItemFormValues = z.infer<typeof recipeItemSchema>;
