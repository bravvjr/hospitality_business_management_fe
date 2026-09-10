import { apiFetch } from "@/lib/api/client";

export interface DashboardSummary {
  date: string;
  currency: string;
  sales_total_minor: number;
  sales_count: number;
  expenses_total_minor: number;
  expenses_count: number;
  net_position_minor: number;
  low_stock_count: number;
}

export interface DashboardRecentSale {
  id: string;
  total_minor: number;
  currency: string;
  completed_at: string;
  item_count: number;
}

export interface DashboardRecentExpense {
  id: string;
  amount_minor: number;
  currency: string;
  description: string;
  expense_date: string;
  category_name: string;
}

export interface DashboardRecent {
  sales: DashboardRecentSale[];
  expenses: DashboardRecentExpense[];
}

export interface DashboardLowStock {
  product_id: string;
  product_name: string;
  quantity_base: string;
  reorder_level_base: string | null;
  unit_symbol: string;
}

export function fetchDashboardSummary(params?: {
  date?: string;
  currency?: string;
}): Promise<DashboardSummary> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.currency) query.set("currency", params.currency);
  const suffix = query.toString() ? `?${query}` : "";
  return apiFetch<DashboardSummary>(`/api/v1/dashboard/summary${suffix}`);
}

export function fetchDashboardRecent(limit = 10): Promise<DashboardRecent> {
  return apiFetch<DashboardRecent>(`/api/v1/dashboard/recent?limit=${limit}`);
}

export function fetchDashboardLowStock(
  limit = 10,
): Promise<DashboardLowStock[]> {
  return apiFetch<DashboardLowStock[]>(
    `/api/v1/dashboard/low-stock?limit=${limit}`,
  );
}
