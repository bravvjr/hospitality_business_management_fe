"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { listOrders } from "@/features/pos/api";
import type { OrderRead } from "@/features/pos/types";
import { formatMinorUnits } from "@/lib/money";

type SalesFilter = "completed" | "voided" | "all";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function mealSummary(order: OrderRead): string {
  if (order.items.length === 0) return "—";
  return order.items
    .map((item) => `${item.product_name} × ${item.quantity}`)
    .join(", ");
}

function paymentLabel(order: OrderRead): string {
  const payment = order.payments[0];
  if (!payment) return "—";
  return `${payment.method}${payment.status !== "captured" && payment.status !== "completed" ? ` (${payment.status})` : ""}`;
}

export function SalesHistoryPanel() {
  const [filter, setFilter] = useState<SalesFilter>("completed");

  const salesQuery = useQuery({
    queryKey: ["pos", "orders", "sales", filter],
    queryFn: () =>
      listOrders({
        status: filter === "all" ? undefined : filter,
        limit: 100,
      }),
  });

  const orders = useMemo(() => {
    const items = salesQuery.data?.items ?? [];
    if (filter !== "all") return items;
    return items.filter(
      (order) => order.status === "completed" || order.status === "voided",
    );
  }, [salesQuery.data?.items, filter]);

  const totalMinor = useMemo(
    () =>
      orders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + order.total_minor, 0),
    [orders],
  );

  const currency = orders[0]?.currency ?? "KES";

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Sales history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed POS sales with meals, amounts, and receipt numbers.
          </p>
        </div>
        {filter === "completed" && orders.length > 0 ? (
          <p className="text-sm font-medium text-brand-rich-teal">
            Listed total: {formatMinorUnits(totalMinor, currency)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["completed", "Completed"],
            ["voided", "Voided"],
            ["all", "Completed + voided"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={filter === key ? "default" : "secondary"}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {salesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sales…</p>
      ) : null}
      {salesQuery.isError ? (
        <p className="text-sm text-red-600">
          {(salesQuery.error as Error).message}
        </p>
      ) : null}
      {!salesQuery.isLoading && orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No sales in this filter yet. Complete a cash sale on the Sell tab to
          see it here.
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="glass-panel min-h-0 flex-1 overflow-auto rounded-xl">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted/80 text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Receipt</th>
                <th className="px-3 py-2 font-medium">Meals</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border/60">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatWhen(order.completed_at ?? order.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    {order.receipt_number != null
                      ? `#${order.receipt_number}`
                      : "—"}
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    <span className="line-clamp-2">{mealSummary(order)}</span>
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {paymentLabel(order)}
                  </td>
                  <td className="px-3 py-2 capitalize">{order.status}</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatMinorUnits(order.total_minor, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
