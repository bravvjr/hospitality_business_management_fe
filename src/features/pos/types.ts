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
  status: string;
  created_at: string;
  updated_at: string;
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
