import { apiFetch } from "@/lib/api/client";

import type {
  Page,
  RecipeCostRead,
  RecipeCreateRequest,
  RecipeItemCreateRequest,
  RecipeItemRead,
  RecipeItemUpdateRequest,
  RecipeRead,
  RecipeSummaryRead,
  RecipeUpdateRequest,
} from "./types";

export function listRecipes(params?: {
  productId?: string;
  limit?: number;
  offset?: number;
}): Promise<Page<RecipeSummaryRead>> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (params?.productId) query.set("product_id", params.productId);
  return apiFetch<Page<RecipeSummaryRead>>(`/api/v1/recipes?${query.toString()}`);
}

export function getRecipe(recipeId: string): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(`/api/v1/recipes/${recipeId}`);
}

export function getRecipeCost(recipeId: string): Promise<RecipeCostRead> {
  return apiFetch<RecipeCostRead>(`/api/v1/recipes/${recipeId}/cost`);
}

export function createRecipe(payload: RecipeCreateRequest): Promise<RecipeRead> {
  return apiFetch<RecipeRead>("/api/v1/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRecipe(
  recipeId: string,
  payload: RecipeUpdateRequest,
): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(`/api/v1/recipes/${recipeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRecipe(recipeId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/recipes/${recipeId}`, {
    method: "DELETE",
  });
}

export function addRecipeItem(
  recipeId: string,
  payload: RecipeItemCreateRequest,
): Promise<RecipeItemRead> {
  return apiFetch<RecipeItemRead>(`/api/v1/recipes/${recipeId}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRecipeItem(
  recipeId: string,
  itemId: string,
  payload: RecipeItemUpdateRequest,
): Promise<RecipeItemRead> {
  return apiFetch<RecipeItemRead>(
    `/api/v1/recipes/${recipeId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteRecipeItem(recipeId: string, itemId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/recipes/${recipeId}/items/${itemId}`, {
    method: "DELETE",
  });
}
