"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchDashboardLowStock,
  fetchDashboardRecent,
  fetchDashboardSummary,
} from "@/features/dashboard/api";
import {
  createExpense,
  listExpenseCategories,
} from "@/features/expenses/api";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/features/expenses/schemas";
import { ProductCreateForm } from "@/features/inventory/components/product-create-form";
import { ApiError } from "@/lib/api/client";
import { formatMinorUnits, parseMajorToMinor } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardScreen() {
  const queryClient = useQueryClient();
  const currency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

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
  const categoriesQuery = useQuery({
    queryKey: ["expenses", "categories"],
    queryFn: () => listExpenseCategories({ limit: 100 }),
    enabled: showExpenseDialog,
  });

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category_id: "",
      amount_major: "",
      currency,
      description: "",
      expense_date: todayIsoDate(),
      note: "",
    },
  });

  const activeCategories =
    categoriesQuery.data?.items.filter((c) => c.status === "active") ?? [];

  async function invalidateDashboard() {
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["expenses"] });
    await queryClient.invalidateQueries({ queryKey: ["inventory"] });
  }

  async function onCreateExpense(values: ExpenseFormValues) {
    setExpenseError(null);
    const amountMinor = parseMajorToMinor(values.amount_major);
    if (amountMinor == null || amountMinor <= 0) {
      setExpenseError("Enter a valid amount");
      return;
    }
    try {
      await createExpense({
        category_id: values.category_id,
        amount_minor: amountMinor,
        currency: values.currency.toUpperCase(),
        description: values.description.trim(),
        expense_date: values.expense_date,
        note: values.note?.trim() || null,
      });
      expenseForm.reset({
        category_id: "",
        amount_major: "",
        currency,
        description: "",
        expense_date: todayIsoDate(),
        note: "",
      });
      setShowExpenseDialog(false);
      await invalidateDashboard();
    } catch (error) {
      setExpenseError(
        error instanceof ApiError ? error.message : "Could not save expense",
      );
    }
  }

  const summary = summaryQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today&apos;s sales, expenses, and stock alerts.
            {summary ? ` · ${summary.date}` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowExpenseDialog(true)}>
            Record expense
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowProductDialog(true)}
          >
            Add product
          </Button>
        </div>
      </div>

      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Record expense</DialogTitle>
            <DialogDescription>
              Quickly log an expense from your dashboard.
            </DialogDescription>
          </DialogHeader>
          {expenseError ? (
            <p className="text-sm text-red-600">{expenseError}</p>
          ) : null}
          {activeCategories.length === 0 && !categoriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Create an expense category first from the{" "}
              <Link href="/expenses" className="text-brand-rich-teal hover:underline">
                Expenses
              </Link>{" "}
              screen.
            </p>
          ) : (
            <form
              onSubmit={expenseForm.handleSubmit(onCreateExpense)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="dash-category">
                  Category
                </label>
                <select
                  id="dash-category"
                  className={fieldClassName}
                  {...expenseForm.register("category_id")}
                >
                  <option value="">Select category</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="dash-amount">
                  Amount
                </label>
                <input
                  id="dash-amount"
                  className={fieldClassName}
                  {...expenseForm.register("amount_major")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="dash-currency">
                  Currency
                </label>
                <input
                  id="dash-currency"
                  maxLength={3}
                  className={`${fieldClassName} uppercase`}
                  {...expenseForm.register("currency")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="dash-desc">
                  Description
                </label>
                <input
                  id="dash-desc"
                  className={fieldClassName}
                  {...expenseForm.register("description")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="dash-date">
                  Date
                </label>
                <input
                  id="dash-date"
                  type="date"
                  className={fieldClassName}
                  {...expenseForm.register("expense_date")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="dash-note">
                  Note
                </label>
                <input
                  id="dash-note"
                  className={fieldClassName}
                  {...expenseForm.register("note")}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  type="submit"
                  disabled={expenseForm.formState.isSubmitting}
                >
                  Save expense
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowExpenseDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>
              Create a product to receive stock and sell in POS.
            </DialogDescription>
          </DialogHeader>
          <ProductCreateForm
            onCancel={() => setShowProductDialog(false)}
            onCreated={async () => {
              setShowProductDialog(false);
              await invalidateDashboard();
            }}
          />
        </DialogContent>
      </Dialog>

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
            <ul className="glass-panel divide-y divide-border/60 rounded-xl">
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
            <ul className="glass-panel divide-y divide-border/60 rounded-xl">
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
          <div className="glass-panel overflow-x-auto rounded-xl">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">On hand</th>
                  <th className="px-3 py-2 font-medium">Reorder at</th>
                </tr>
              </thead>
              <tbody>
                {lowStockQuery.data?.map((row) => (
                  <tr key={row.product_id} className="border-t border-border/60">
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
    <div className="glass-panel rounded-2xl p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
