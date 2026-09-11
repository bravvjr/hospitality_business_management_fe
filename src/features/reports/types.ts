export type GroupBy = "day" | "week" | "month";
export type SalesSortBy = "revenue" | "quantity";

export type ReportExportKey =
  | "sales-summary"
  | "sales-by-product"
  | "sales-by-payment-method"
  | "expenses-by-category"
  | "pnl"
  | "inventory-movements";

export interface ReportDateParams {
  from: string;
  to: string;
  currency?: string;
}

export interface SalesBucket {
  period_start: string;
  total_minor: number;
  order_count: number;
}

export interface SalesSummary {
  currency: string;
  from_date: string;
  to_date: string;
  total_minor: number;
  order_count: number;
  average_ticket_minor: number;
  buckets: SalesBucket[];
}

export interface CategoryExpense {
  category_id: string;
  category_name: string;
  total_minor: number;
  expense_count: number;
}

export interface ExpensesByCategory {
  currency: string;
  from_date: string;
  to_date: string;
  categories: CategoryExpense[];
}

export interface PnlReport {
  currency: string;
  from_date: string;
  to_date: string;
  revenue_minor: number;
  expense_minor: number;
  net_minor: number;
  order_count: number;
  expense_count: number;
}

export interface ProductSales {
  product_id: string;
  product_name: string;
  total_minor: number;
  quantity: string;
  line_count: number;
}

export interface SalesByProduct {
  currency: string;
  from_date: string;
  to_date: string;
  products: ProductSales[];
}

export interface PaymentMethodSales {
  method: string;
  total_minor: number;
  payment_count: number;
}

export interface SalesByPaymentMethod {
  currency: string;
  from_date: string;
  to_date: string;
  methods: PaymentMethodSales[];
}

export interface MovementTypeSummary {
  movement_type: string;
  movement_count: number;
  total_quantity_delta_base: string;
}

export interface InventoryMovementSummary {
  from_date: string;
  to_date: string;
  movement_type: string | null;
  types: MovementTypeSummary[];
}
