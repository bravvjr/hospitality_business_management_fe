export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface UnitRead {
  id: string;
  key: string;
  name: string;
  symbol: string;
}

export interface ProductRead {
  id: string;
  tenant_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  base_unit: UnitRead;
  reorder_level_base: string | null;
  unit_price_minor: number | null;
  currency: string | null;
  unit_cost_minor: number | null;
  cost_currency: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  name: string;
  base_unit_id: string;
  sku?: string | null;
  category?: string | null;
  reorder_level_base?: string | null;
  unit_price_minor?: number | null;
  currency?: string | null;
  unit_cost_minor?: number | null;
  cost_currency?: string | null;
}

export interface ProductUpdateRequest {
  name?: string | null;
  sku?: string | null;
  category?: string | null;
  reorder_level_base?: string | null;
  unit_price_minor?: number | null;
  currency?: string | null;
  unit_cost_minor?: number | null;
  cost_currency?: string | null;
  status?: "active" | "inactive" | null;
}

export interface ProductUnitRead {
  id: string;
  product_id: string;
  unit: UnitRead;
  to_base_factor: string;
  is_stock: boolean;
  is_purchase: boolean;
  is_recipe: boolean;
  is_sales: boolean;
}

export interface ProductUnitCreateRequest {
  unit_id: string;
  to_base_factor: string;
  is_stock?: boolean;
  is_purchase?: boolean;
  is_recipe?: boolean;
  is_sales?: boolean;
}

export interface StockLevelRead {
  product_id: string;
  product_name: string;
  base_unit: UnitRead;
  quantity_base: string;
  reorder_level_base: string | null;
  is_low_stock: boolean;
}

export interface StockMovementRead {
  id: string;
  tenant_id: string;
  product_id: string;
  movement_type: string;
  quantity_delta_base: string;
  entered_quantity: string;
  entered_unit: UnitRead;
  to_base_factor_snapshot: string;
  reason: string;
  note: string | null;
  source_document_type: string | null;
  source_document_id: string | null;
  actor_user_id: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export interface StockMovementCreateRequest {
  product_id: string;
  quantity: string;
  unit_id: string;
  reason: string;
  note?: string | null;
}

export interface StockAdjustmentRequest {
  product_id: string;
  quantity: string;
  unit_id: string;
  reason: string;
  note?: string | null;
}
