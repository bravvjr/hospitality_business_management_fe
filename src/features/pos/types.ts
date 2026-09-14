import type { ProductRead } from "@/features/inventory/types";

export type { ProductRead };

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface OrderItemRead {
  id: string;
  product_id: string;
  product_name: string;
  unit_id: string;
  quantity: string;
  unit_price_minor: number;
  line_total_minor: number;
  currency: string;
}

export interface PaymentRead {
  id: string;
  method: string;
  amount_minor: number;
  currency: string;
  status: string;
  provider_ref: string | null;
  paid_at: string | null;
}

export interface OrderRead {
  id: string;
  tenant_id: string;
  status: string;
  channel: string;
  currency: string;
  subtotal_minor: number;
  total_minor: number;
  cashier_user_id: string | null;
  completed_at: string | null;
  receipt_number: number | null;
  kitchen_status: string | null;
  voided_at: string | null;
  voided_by_user_id: string | null;
  void_reason: string | null;
  note: string | null;
  items: OrderItemRead[];
  payments: PaymentRead[];
  created_at: string;
  updated_at: string;
  change_minor: number | null;
}

export interface SaleReceiptLineRead {
  product_name: string;
  quantity: string;
  unit_price_minor: number;
  line_total_minor: number;
}

export interface SaleReceiptPaymentRead {
  method: string;
  amount_minor: number;
  change_minor: number | null;
}

export interface SaleReceiptRead {
  receipt_number: number;
  order_id: string;
  business_name: string;
  currency: string;
  completed_at: string;
  cashier_email: string | null;
  items: SaleReceiptLineRead[];
  subtotal_minor: number;
  total_minor: number;
  payments: SaleReceiptPaymentRead[];
  note: string | null;
}
