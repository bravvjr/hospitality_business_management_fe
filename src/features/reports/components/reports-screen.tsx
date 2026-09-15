"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  downloadReportCsv,
  fetchExpensesByCategory,
  fetchInventoryMovements,
  fetchPnl,
  fetchSalesByPaymentMethod,
  fetchSalesByProduct,
  fetchSalesSummary,
} from "@/features/reports/api";
import {
  type DatePreset,
  isValidDateRange,
  rangeForPreset,
} from "@/features/reports/date-range";
import type { ReportExportKey } from "@/features/reports/types";
import { ApiError } from "@/lib/api/client";
import { formatMinorUnits } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom" },
];

const EXPORT_OPTIONS: { key: ReportExportKey; label: string }[] = [
  { key: "pnl", label: "P&L" },
  { key: "sales-summary", label: "Sales summary" },
  { key: "expenses-by-category", label: "Expenses by category" },
  { key: "sales-by-product", label: "Sales by product" },
  { key: "sales-by-payment-method", label: "Sales by payment method" },
  { key: "inventory-movements", label: "Inventory movements" },
];

export function ReportsScreen() {
  const currency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [fromDate, setFromDate] = useState(() => rangeForPreset("30d").from);
  const [toDate, setToDate] = useState(() => rangeForPreset("30d").to);
  const [exportError, setExportError] = useState<string | null>(null);

  const rangeValid = isValidDateRange(fromDate, toDate);
  const rangeParams = useMemo(
    () => ({ from: fromDate, to: toDate, currency }),
    [fromDate, toDate, currency],
  );

  const pnlQuery = useQuery({
    queryKey: ["reports", "pnl", rangeParams],
    queryFn: () => fetchPnl(rangeParams),
    enabled: rangeValid,
  });
  const salesQuery = useQuery({
    queryKey: ["reports", "sales-summary", rangeParams],
    queryFn: () => fetchSalesSummary({ ...rangeParams, group_by: "day" }),
    enabled: rangeValid,
  });
  const expensesQuery = useQuery({
    queryKey: ["reports", "expenses-by-category", rangeParams],
    queryFn: () => fetchExpensesByCategory(rangeParams),
    enabled: rangeValid,
  });
  const productsQuery = useQuery({
    queryKey: ["reports", "sales-by-product", rangeParams],
    queryFn: () =>
      fetchSalesByProduct({ ...rangeParams, limit: 10, sort: "revenue" }),
    enabled: rangeValid,
  });
  const paymentMethodsQuery = useQuery({
    queryKey: ["reports", "sales-by-payment-method", rangeParams],
    queryFn: () => fetchSalesByPaymentMethod(rangeParams),
    enabled: rangeValid,
  });
  const movementsQuery = useQuery({
    queryKey: ["reports", "inventory-movements", rangeParams],
    queryFn: () => fetchInventoryMovements(rangeParams),
    enabled: rangeValid,
  });

  const exportMutation = useMutation({
    mutationFn: (reportKey: ReportExportKey) =>
      downloadReportCsv(reportKey, {
        ...rangeParams,
        group_by: reportKey === "sales-summary" ? "day" : undefined,
        limit: reportKey === "sales-by-product" ? 10 : undefined,
        sort: reportKey === "sales-by-product" ? "revenue" : undefined,
      }),
    onMutate: () => setExportError(null),
    onError: (error) => {
      setExportError(
        error instanceof ApiError ? error.message : "CSV export failed",
      );
    },
  });

  function applyPreset(next: DatePreset) {
    setPreset(next);
    if (next !== "custom") {
      const range = rangeForPreset(next);
      setFromDate(range.from);
      setToDate(range.to);
    }
  }

  const isLoading =
    pnlQuery.isLoading ||
    salesQuery.isLoading ||
    expensesQuery.isLoading ||
    productsQuery.isLoading ||
    paymentMethodsQuery.isLoading ||
    movementsQuery.isLoading;

  const queryError =
    pnlQuery.error ??
    salesQuery.error ??
    expensesQuery.error ??
    productsQuery.error ??
    paymentMethodsQuery.error ??
    movementsQuery.error;

  const pnl = pnlQuery.data;
  const sales = salesQuery.data;
  const expenses = expensesQuery.data;
  const products = productsQuery.data;
  const paymentMethods = paymentMethodsQuery.data;
  const movements = movementsQuery.data;

  return (
    <div className="space-y-8">
      <header className="glass-section flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Period sales, expenses, and inventory movement summaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPORT_OPTIONS.map((option) => (
            <Button
              key={option.key}
              type="button"
              variant="secondary"
              size="sm"
              disabled={!rangeValid || exportMutation.isPending}
              onClick={() => exportMutation.mutate(option.key)}
            >
              <Download className="mr-1.5 size-4" />
              {option.label}
            </Button>
          ))}
        </div>
      </header>

      <section className="glass-section space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={preset === item.id ? "default" : "secondary"}
              onClick={() => applyPreset(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium text-foreground">From</span>
            <input
              type="date"
              className={`${fieldClassName} mt-1.5 block`}
              value={fromDate}
              onChange={(event) => {
                setPreset("custom");
                setFromDate(event.target.value);
              }}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-foreground">To</span>
            <input
              type="date"
              className={`${fieldClassName} mt-1.5 block`}
              value={toDate}
              onChange={(event) => {
                setPreset("custom");
                setToDate(event.target.value);
              }}
            />
          </label>
          <p className="text-sm text-muted-foreground">
            Currency: <span className="font-medium text-foreground">{currency}</span>
          </p>
        </div>
        {!rangeValid ? (
          <p className="text-sm text-red-600">Choose a valid date range.</p>
        ) : null}
        {exportError ? (
          <p className="text-sm text-red-600">{exportError}</p>
        ) : null}
      </section>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : null}
      {queryError ? (
        <p className="text-sm text-red-600">
          {(queryError as Error).message}
        </p>
      ) : null}

      {pnl ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Revenue"
            value={formatMinorUnits(pnl.revenue_minor, pnl.currency)}
            hint={`${pnl.order_count} sale${pnl.order_count === 1 ? "" : "s"}`}
          />
          <Kpi
            label="Expenses"
            value={formatMinorUnits(pnl.expense_minor, pnl.currency)}
            hint={`${pnl.expense_count} entr${pnl.expense_count === 1 ? "y" : "ies"}`}
          />
          <Kpi
            label="Net profit"
            value={formatMinorUnits(pnl.net_minor, pnl.currency)}
            hint={`${pnl.from_date} → ${pnl.to_date}`}
          />
          {sales ? (
            <Kpi
              label="Average ticket"
              value={formatMinorUnits(
                sales.average_ticket_minor,
                sales.currency,
              )}
              hint={`${sales.order_count} orders in period`}
            />
          ) : null}
        </div>
      ) : null}

      {sales && sales.buckets.length > 0 ? (
        <ReportTable
          title="Sales by day"
          headers={["Date", "Orders", "Total"]}
          rows={sales.buckets.map((bucket) => [
            bucket.period_start,
            String(bucket.order_count),
            formatMinorUnits(bucket.total_minor, sales.currency),
          ])}
        />
      ) : null}

      {expenses ? (
        <ReportTable
          title="Expenses by category"
          headers={["Category", "Entries", "Total"]}
          emptyMessage="No expenses in this period."
          rows={expenses.categories.map((row) => [
            row.category_name,
            String(row.expense_count),
            formatMinorUnits(row.total_minor, expenses.currency),
          ])}
        />
      ) : null}

      {products ? (
        <ReportTable
          title="Top products by revenue"
          headers={["Product", "Qty", "Lines", "Revenue"]}
          emptyMessage="No product sales in this period."
          rows={products.products.map((row) => [
            row.product_name,
            row.quantity,
            String(row.line_count),
            formatMinorUnits(row.total_minor, products.currency),
          ])}
        />
      ) : null}

      {paymentMethods ? (
        <ReportTable
          title="Sales by payment method"
          headers={["Method", "Payments", "Total"]}
          emptyMessage="No payments in this period."
          rows={paymentMethods.methods.map((row) => [
            row.method,
            String(row.payment_count),
            formatMinorUnits(row.total_minor, paymentMethods.currency),
          ])}
        />
      ) : null}

      {movements ? (
        <ReportTable
          title="Inventory movements"
          headers={["Type", "Movements", "Net quantity (base)"]}
          emptyMessage="No stock movements in this period."
          rows={movements.types.map((row) => [
            row.movement_type,
            String(row.movement_count),
            row.total_quantity_delta_base,
          ])}
        />
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="glass-kpi p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  emptyMessage = "No data for this period.",
}: {
  title: string;
  headers: string[];
  rows: string[][];
  emptyMessage?: string;
}) {
  return (
    <section className="glass-section space-y-3 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className="border-t border-border">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${title}-${index}-${cellIndex}`}
                      className={`px-3 py-2 ${cellIndex === 0 ? "font-medium" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
