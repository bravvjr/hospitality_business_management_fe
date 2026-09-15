"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  PackagePlus,
  Receipt,
  ShoppingBag,
  Wallet,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm outline-none ring-ring backdrop-blur-sm focus:ring-2";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardScreen() {
  const queryClient = useQueryClient();
  const tenant = useAppSelector((state) => state.auth.tenant);
  const currency = tenant?.base_currency ?? "KES";
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
  const netPositive = (summary?.net_position_minor ?? 0) >= 0;

  return (
    <div className="space-y-8">
      <header className="glass-section p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-rich-teal">
              {tenant?.name ?? "Your business"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Today&apos;s sales, expenses, and stock alerts.
              {summary ? ` · ${summary.date}` : null}
            </p>
          </div>
          <div className="glass-surface flex flex-wrap gap-2 rounded-xl p-2">
            <Button type="button" onClick={() => setShowExpenseDialog(true)}>
              <Receipt className="size-4" />
              Record expense
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowProductDialog(true)}
            >
              <PackagePlus className="size-4" />
              Add product
            </Button>
            <Link
              href="/pos"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-brand-light-jade/10"
            >
              <ShoppingBag className="size-4" />
              Open POS
            </Link>
          </div>
        </div>
      </header>

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

      {summaryQuery.isError ? (
        <p className="glass-panel rounded-xl px-4 py-3 text-sm text-red-600">
          {(summaryQuery.error as Error).message}
        </p>
      ) : null}

      {summaryQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-kpi h-28 rounded-2xl p-4">
              <div className="glass-shimmer h-3 w-20 rounded" />
              <div className="glass-shimmer mt-4 h-8 w-32 rounded" />
              <div className="glass-shimmer mt-3 h-2.5 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Sales today"
              value={formatMinorUnits(summary.sales_total_minor, summary.currency)}
              hint={`${summary.sales_count} sale${summary.sales_count === 1 ? "" : "s"}`}
              accent="var(--brand-rich-teal)"
              icon={ArrowUpRight}
            />
            <Kpi
              label="Expenses today"
              value={formatMinorUnits(
                summary.expenses_total_minor,
                summary.currency,
              )}
              hint={`${summary.expenses_count} entr${summary.expenses_count === 1 ? "y" : "ies"}`}
              accent="var(--brand-rich-cyan)"
              icon={ArrowDownRight}
            />
            <Kpi
              label="Net position"
              value={formatMinorUnits(summary.net_position_minor, summary.currency)}
              hint="Sales − expenses"
              accent={netPositive ? "#0a9396" : "#b42318"}
              icon={Wallet}
              valueClassName={netPositive ? "text-brand-rich-teal" : "text-destructive"}
            />
            <Kpi
              label="Low stock"
              value={String(summary.low_stock_count)}
              hint={
                summary.low_stock_count > 0 ? (
                  <Link href="/inventory" className="text-brand-rich-teal hover:underline">
                    Review inventory
                  </Link>
                ) : (
                  "All levels OK"
                )
              }
              accent={summary.low_stock_count > 0 ? "#d97706" : "var(--brand-light-jade)"}
              icon={AlertTriangle}
              valueClassName={
                summary.low_stock_count > 0
                  ? "text-amber-700 dark:text-amber-300"
                  : undefined
              }
            />
          </div>

          <div
            className={cn(
              "glass-section flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between",
              netPositive
                ? "border-brand-rich-teal/30"
                : "border-destructive/30",
            )}
          >
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s net position</p>
              <p
                className={cn(
                  "mt-1 text-xl font-bold tracking-tight",
                  netPositive ? "text-brand-rich-teal" : "text-destructive",
                )}
              >
                {formatMinorUnits(summary.net_position_minor, summary.currency)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatMinorUnits(summary.sales_total_minor, summary.currency)} sales
              {" · "}
              {formatMinorUnits(summary.expenses_total_minor, summary.currency)} expenses
            </p>
          </div>
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Recent sales"
          loading={recentQuery.isLoading}
          emptyMessage="No completed sales yet."
          isEmpty={(recentQuery.data?.sales.length ?? 0) === 0}
        >
          <ul className="divide-y divide-border/50">
            {recentQuery.data?.sales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-brand-light-jade/10"
              >
                <div>
                  <p className="font-medium">
                    {sale.item_count} item{sale.item_count === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sale.completed_at).toLocaleString()}
                  </p>
                </div>
                <p className="font-semibold text-brand-rich-teal">
                  {formatMinorUnits(sale.total_minor, sale.currency)}
                </p>
              </li>
            ))}
          </ul>
        </DashboardSection>

        <DashboardSection
          title="Recent expenses"
          loading={recentQuery.isLoading}
          emptyMessage="No expenses recorded yet."
          isEmpty={(recentQuery.data?.expenses.length ?? 0) === 0}
        >
          <ul className="divide-y divide-border/50">
            {recentQuery.data?.expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-brand-light-jade/10"
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
        </DashboardSection>
      </div>

      <DashboardSection
        title="Low stock"
        action={
          <Link
            href="/inventory"
            className="text-sm text-brand-rich-teal hover:underline"
          >
            Open inventory
          </Link>
        }
        loading={lowStockQuery.isLoading}
        emptyMessage="No low-stock items."
        isEmpty={(lowStockQuery.data?.length ?? 0) === 0}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">On hand</th>
                <th className="px-4 py-2.5 font-medium">Reorder at</th>
              </tr>
            </thead>
            <tbody>
              {lowStockQuery.data?.map((row) => (
                <tr
                  key={row.product_id}
                  className="border-t border-border/50 transition hover:bg-amber-500/5"
                >
                  <td className="px-4 py-2.5 font-medium">{row.product_name}</td>
                  <td className="px-4 py-2.5 text-amber-700 dark:text-amber-300">
                    {row.quantity_base} {row.unit_symbol}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {row.reorder_level_base
                      ? `${row.reorder_level_base} ${row.unit_symbol}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}

function DashboardSection({
  title,
  action,
  loading,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  loading: boolean;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-section overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {loading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-shimmer h-10 rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  hint: React.ReactNode;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="glass-kpi p-4" style={{ "--kpi-accent": accent } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold tracking-tight text-foreground",
              valueClassName,
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}
