import { apiFetch } from "@/lib/api/client";

import type {
  Page,
  ProductCreateRequest,
  ProductRead,
  ProductUnitCreateRequest,
  ProductUnitRead,
  ProductUpdateRequest,
  StockAdjustmentRequest,
  StockLevelRead,
  StockMovementCreateRequest,
  StockMovementRead,
  UnitRead,
} from "./types";

export function listUnits(): Promise<UnitRead[]> {
  return apiFetch<UnitRead[]>("/api/v1/inventory/units");
}

export function listProducts(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<ProductRead>> {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  return apiFetch<Page<ProductRead>>(
    `/api/v1/inventory/products?limit=${limit}&offset=${offset}`,
  );
}

export function createProduct(
  payload: ProductCreateRequest,
): Promise<ProductRead> {
  return apiFetch<ProductRead>("/api/v1/inventory/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  productId: string,
  payload: ProductUpdateRequest,
): Promise<ProductRead> {
  return apiFetch<ProductRead>(`/api/v1/inventory/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listProductUnits(productId: string): Promise<ProductUnitRead[]> {
  return apiFetch<ProductUnitRead[]>(
    `/api/v1/inventory/products/${productId}/units`,
  );
}

export function addProductUnit(
  productId: string,
  payload: ProductUnitCreateRequest,
): Promise<ProductUnitRead> {
  return apiFetch<ProductUnitRead>(
    `/api/v1/inventory/products/${productId}/units`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function listStockLevels(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<StockLevelRead>> {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  return apiFetch<Page<StockLevelRead>>(
    `/api/v1/inventory/stock/levels?limit=${limit}&offset=${offset}`,
  );
}

export function listLowStockLevels(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<StockLevelRead>> {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  return apiFetch<Page<StockLevelRead>>(
    `/api/v1/inventory/stock/levels/low?limit=${limit}&offset=${offset}`,
  );
}

export function listStockMovements(params?: {
  productId?: string;
  limit?: number;
  offset?: number;
}): Promise<Page<StockMovementRead>> {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (params?.productId) query.set("product_id", params.productId);
  return apiFetch<Page<StockMovementRead>>(
    `/api/v1/inventory/stock/movements?${query.toString()}`,
  );
}

export function recordStockReceipt(
  payload: StockMovementCreateRequest,
): Promise<StockMovementRead> {
  return apiFetch<StockMovementRead>("/api/v1/inventory/stock/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recordStockUsage(
  payload: StockMovementCreateRequest,
): Promise<StockMovementRead> {
  return apiFetch<StockMovementRead>("/api/v1/inventory/stock/usages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recordStockAdjustment(
  payload: StockAdjustmentRequest,
): Promise<StockMovementRead> {
  return apiFetch<StockMovementRead>("/api/v1/inventory/stock/adjustments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
