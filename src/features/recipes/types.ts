import type { Page, ProductRead, UnitRead } from "@/features/inventory/types";

export type { Page };

export interface RecipeItemRead {
  id: string;
  ingredient_product_id: string;
  ingredient_product: ProductRead;
  quantity: string;
  unit: UnitRead;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeSummaryRead {
  id: string;
  tenant_id: string;
  product_id: string;
  product: ProductRead;
  yields_quantity: string;
  status: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeRead {
  id: string;
  tenant_id: string;
  product_id: string;
  product: ProductRead;
  yields_quantity: string;
  status: string;
  notes: string | null;
  items: RecipeItemRead[];
  created_at: string;
  updated_at: string;
}

export interface RecipeItemCreateRequest {
  ingredient_product_id: string;
  quantity: string;
  unit_id: string;
  sort_order?: number;
}

export interface RecipeItemUpdateRequest {
  quantity?: string;
  unit_id?: string;
  sort_order?: number;
}

export interface RecipeCreateRequest {
  product_id: string;
  yields_quantity?: string;
  notes?: string | null;
  items: RecipeItemCreateRequest[];
}

export interface RecipeUpdateRequest {
  yields_quantity?: string;
  status?: "active" | "inactive";
  notes?: string | null;
}
