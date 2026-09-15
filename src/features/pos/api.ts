import { apiFetch, apiFetchText } from "@/lib/api/client";
import { listRecipes } from "@/features/recipes/api";
import type { Page, ProductRead } from "@/features/inventory/types";

import type { OrderRead, SaleReceiptRead } from "./types";

/** Menu meals with an active recipe — not raw inventory ingredients. */
export async function listSellableProducts(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<ProductRead>> {
  const limit = params?.limit ?? 200;
  const offset = params?.offset ?? 0;
  const recipes = await listRecipes({ limit: 200, offset: 0 });
  const meals = recipes.items
    .filter(
      (recipe) =>
        recipe.status === "active" &&
        recipe.product.status === "active" &&
        recipe.product.unit_price_minor != null &&
        recipe.product.currency != null,
    )
    .map((recipe) => recipe.product);

  return {
    items: meals.slice(offset, offset + limit),
    total: meals.length,
    limit,
    offset,
  };
}

export function createOrder(payload: {
  note?: string | null;
  currency?: string | null;
} = {}): Promise<OrderRead> {
  return apiFetch<OrderRead>("/api/v1/pos/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrder(orderId: string): Promise<OrderRead> {
  return apiFetch<OrderRead>(`/api/v1/pos/orders/${orderId}`);
}

export function addOrderItem(
  orderId: string,
  payload: { product_id: string; quantity: string; unit_id?: string | null },
): Promise<OrderRead> {
  return apiFetch<OrderRead>(`/api/v1/pos/orders/${orderId}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOrderItem(
  orderId: string,
  itemId: string,
  payload: { quantity: string },
): Promise<OrderRead> {
  return apiFetch<OrderRead>(
    `/api/v1/pos/orders/${orderId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function removeOrderItem(
  orderId: string,
  itemId: string,
): Promise<OrderRead> {
  return apiFetch<OrderRead>(
    `/api/v1/pos/orders/${orderId}/items/${itemId}`,
    { method: "DELETE" },
  );
}

export function completeSale(
  orderId: string,
  payload: {
    payment_method: "cash" | "mpesa";
    amount_tendered_minor?: number | null;
  },
): Promise<OrderRead> {
  return apiFetch<OrderRead>(`/api/v1/pos/orders/${orderId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReceipt(orderId: string): Promise<SaleReceiptRead> {
  return apiFetch<SaleReceiptRead>(`/api/v1/pos/orders/${orderId}/receipt`);
}

export function getReceiptText(orderId: string): Promise<string> {
  return apiFetchText(`/api/v1/pos/orders/${orderId}/receipt.txt`);
}
