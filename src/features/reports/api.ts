import { apiFetch, apiFetchText } from "@/lib/api/client";

import type {
  ExpensesByCategory,
  GroupBy,
  InventoryMovementSummary,
  PnlReport,
  ReportDateParams,
  ReportExportKey,
  SalesByPaymentMethod,
  SalesByProduct,
  SalesSortBy,
  SalesSummary,
} from "./types";

function buildQuery(params: {
  from: string;
  to: string;
  currency?: string;
  group_by?: GroupBy;
  limit?: number;
  sort?: SalesSortBy;
  movement_type?: string;
}): string {
  const query = new URLSearchParams();
  query.set("from", params.from);
  query.set("to", params.to);
  if (params.currency) query.set("currency", params.currency);
  if (params.group_by) query.set("group_by", params.group_by);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  if (params.movement_type) query.set("movement_type", params.movement_type);
  return query.toString();
}

export function fetchSalesSummary(
  params: ReportDateParams & { group_by?: GroupBy },
): Promise<SalesSummary> {
  return apiFetch<SalesSummary>(
    `/api/v1/reports/sales/summary?${buildQuery(params)}`,
  );
}

export function fetchExpensesByCategory(
  params: ReportDateParams,
): Promise<ExpensesByCategory> {
  return apiFetch<ExpensesByCategory>(
    `/api/v1/reports/expenses/by-category?${buildQuery(params)}`,
  );
}

export function fetchPnl(params: ReportDateParams): Promise<PnlReport> {
  return apiFetch<PnlReport>(`/api/v1/reports/pnl?${buildQuery(params)}`);
}

export function fetchSalesByProduct(
  params: ReportDateParams & { limit?: number; sort?: SalesSortBy },
): Promise<SalesByProduct> {
  return apiFetch<SalesByProduct>(
    `/api/v1/reports/sales/by-product?${buildQuery(params)}`,
  );
}

export function fetchSalesByPaymentMethod(
  params: ReportDateParams,
): Promise<SalesByPaymentMethod> {
  return apiFetch<SalesByPaymentMethod>(
    `/api/v1/reports/sales/by-payment-method?${buildQuery(params)}`,
  );
}

export function fetchInventoryMovements(
  params: ReportDateParams & { movement_type?: string },
): Promise<InventoryMovementSummary> {
  return apiFetch<InventoryMovementSummary>(
    `/api/v1/reports/inventory/movements?${buildQuery(params)}`,
  );
}

export async function downloadReportCsv(
  reportKey: ReportExportKey,
  params: ReportDateParams & {
    group_by?: GroupBy;
    limit?: number;
    sort?: SalesSortBy;
    movement_type?: string;
  },
): Promise<void> {
  const csv = await apiFetchText(
    `/api/v1/reports/exports/${reportKey}.csv?${buildQuery(params)}`,
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportKey}-${params.from}-to-${params.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
