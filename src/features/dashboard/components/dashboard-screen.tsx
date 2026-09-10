"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import {
  fetchDashboardLowStock,
  fetchDashboardRecent,
  fetchDashboardSummary,
} from "@/features/dashboard/api";
import { formatMinorUnits } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";

export function DashboardScreen() {
  const currency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary", currency],
    queryFn: () => fetchDashboardSummary({ currency }),
  });
  const recentQuery = useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: () => fetchDashboardRecent(8),
  });
  const lowStockQuery = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => fetchDashboardLowStock(8),
  });

  const summary = summaryQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s sales, expenses, and stock alerts.
          {summary ? ` · ${summary.date}` : null}
        </p>
      </div>

      {summaryQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading summary…</p>
      ) : null}
      {summaryQuery.isError ? (
        <p className="text-sm text-red-600">
          {(summaryQuery.error as Error).message}
        </p>
      ) : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Sales today"
            value={formatMinorUnits(summary.sales_total_minor, summary.currency)}
            hint={`${summary.sales_count} sale${summary.sales_count === 1 ? "" : "s"}`}
          />
          <Kpi
            label="Expenses today"
            value={formatMinorUnits(
              summary.expenses_total_minor,
              summary.currency,
            )}
            hint={`${summary.expenses_count} entr${summary.expenses_count === 1 ? "y" : "ies"}`}
          />
          <Kpi
            label="Net position"
            value={formatMinorUnits(summary.net_position_minor, summary.currency)}
            hint="Sales − expenses"
          />
          <Kpi
            label="Low stock"
            value={String(summary.low_stock_count)}
            hint={
              summary.low_stock_count > 0 ? (
                <Link href="/inventory" className="hover:underline">
                  Review inventory
                </Link>
              ) : (
                "All levels OK"
              )
            }
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent sales</h2>
          {recentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {(recentQuery.data?.sales.length ?? 0) === 0 && !recentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">No completed sales yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {recentQuery.data?.sales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {sale.item_count} item{sale.item_count === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.completed_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatMinorUnits(sale.total_minor, sale.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent expenses</h2>
          {recentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {(recentQuery.data?.expenses.length ?? 0) === 0 &&
          !recentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {recentQuery.data?.expenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category_name} · {expense.expense_date}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatMinorUnits(expense.amount_minor, expense.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Low stock</h2>
          <Link
            href="/inventory"
            className="text-sm text-brand-rich-teal hover:underline"
          >
            Open inventory
          </Link>
        </div>
        {lowStockQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {(lowStockQuery.data?.length ?? 0) === 0 && !lowStockQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">No low-stock items.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">On hand</th>
                  <th className="px-3 py-2 font-medium">Reorder at</th>
                </tr>
              </thead>
              <tbody>
                {lowStockQuery.data?.map((row) => (
                  <tr key={row.product_id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{row.product_name}</td>
                    <td className="px-3 py-2">
                      {row.quantity_base} {row.unit_symbol}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.reorder_level_base
                        ? `${row.reorder_level_base} ${row.unit_symbol}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
  hint: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
