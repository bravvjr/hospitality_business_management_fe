import { apiFetch, apiFetchText } from "@/lib/api/client";

import type {
  OrderRead,
  Page,
  ProductRead,
  SaleReceiptRead,
} from "./types";

export function listSellableProducts(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<ProductRead>> {
  const limit = params?.limit ?? 200;
  const offset = params?.offset ?? 0;
  return apiFetch<Page<ProductRead>>(
    `/api/v1/inventory/products?limit=${limit}&offset=${offset}`,
  );
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
