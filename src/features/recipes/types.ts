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
  /** Existing menu product (optional when creating a meal inline). */
  product_id?: string;
  /** Free-text meal name — creates a Menu product sold by the piece. */
  meal_name?: string;
  unit_price_minor?: number;
  currency?: string;
  yields_quantity?: string;
  notes?: string | null;
  items: RecipeItemCreateRequest[];
}

export interface RecipeUpdateRequest {
  yields_quantity?: string;
  status?: "active" | "inactive";
  notes?: string | null;
}

export interface RecipeCostLineRead {
  recipe_item_id: string;
  ingredient_product_id: string;
  ingredient_name: string;
  quantity: string;
  unit: UnitRead;
  unit_cost_minor: number | null;
  line_cost_minor: number | null;
  currency: string | null;
}

export interface RecipeCostRead {
  recipe_id: string;
  product_id: string;
  currency: string;
  yields_quantity: string;
  total_cost_minor: number | null;
  cost_per_yield_minor: number | null;
  sell_price_minor: number | null;
  margin_minor: number | null;
  margin_percent: string | null;
  is_complete: boolean;
  lines: RecipeCostLineRead[];
}
