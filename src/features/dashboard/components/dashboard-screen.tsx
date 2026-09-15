"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  PackagePlus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  DashboardCard,
  DashboardSkeleton,
  MiniSparkline,
  StatusBadge,
  ViewAllLink,
} from "@/features/dashboard/components/dashboard-widgets";
import {
  createExpense,
  listExpenseCategories,
} from "@/features/expenses/api";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/features/expenses/schemas";
import { listStockLevels } from "@/features/inventory/api";
import { ProductCreateForm } from "@/features/inventory/components/product-create-form";
import {
  fetchSalesByProduct,
  fetchSalesSummary,
} from "@/features/reports/api";
import { rangeForPreset } from "@/features/reports/date-range";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/auth/permissions";
import { permissionsForRole } from "@/lib/auth/role-permissions";
import { formatMinorUnits, parseMajorToMinor } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm outline-none ring-ring backdrop-blur-sm focus:ring-2";

type ChartRange = "7d" | "30d" | "90d";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDisplayDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function chartRangeParams(range: ChartRange) {
  if (range === "7d") return rangeForPreset("7d");
  if (range === "30d") return rangeForPreset("30d");
  const to = todayIsoDate();
  const from = new Date();
  from.setDate(from.getDate() - 89);
  return { from: from.toISOString().slice(0, 10), to };
}

export function DashboardScreen() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const tenant = useAppSelector((state) => state.auth.tenant);
  const roleKey = useAppSelector((state) => state.auth.membership?.role.key ?? "");
  const permissions = permissionsForRole(roleKey);
  const canReports = hasPermission(permissions, "reports.read");
  const canInventory = hasPermission(permissions, "inventory.read");
  const currency = tenant?.base_currency ?? "KES";

  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const chartParams = useMemo(
    () => ({ ...chartRangeParams(chartRange), currency }),
    [chartRange, currency],
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
    queryFn: () => fetchDashboardLowStock(6),
  });
  const salesChartQuery = useQuery({
    queryKey: ["dashboard", "sales-chart", chartParams],
    queryFn: () =>
      fetchSalesSummary({ ...chartParams, group_by: "day" }),
    enabled: canReports,
  });
  const topProductsQuery = useQuery({
    queryKey: ["dashboard", "top-products", chartParams],
    queryFn: () =>
      fetchSalesByProduct({
        ...chartParams,
        limit: 5,
        sort: "quantity",
      }),
    enabled: canReports,
  });
  const stockLevelsQuery = useQuery({
    queryKey: ["inventory", "stock-levels", "dashboard"],
    queryFn: () => listStockLevels({ limit: 6 }),
    enabled: canInventory,
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

  const summary = summaryQuery.data;
  const salesBuckets = salesChartQuery.data?.buckets ?? [];
  const sparklineValues = salesBuckets.map((bucket) => bucket.total_minor);
  const topProducts = topProductsQuery.data?.products ?? [];
  const maxProductQty = Math.max(
    ...topProducts.map((p) => Number.parseFloat(p.quantity) || 0),
    1,
  );
  const stockLevels = stockLevelsQuery.data?.items ?? [];
  const lowStock = lowStockQuery.data ?? [];
  const netPositive = (summary?.net_position_minor ?? 0) >= 0;
  const displayName = user?.email?.split("@")[0] ?? "there";
  const greeting = greetingForHour(new Date().getHours());

  const activityItems = useMemo(() => {
    const sales = (recentQuery.data?.sales ?? []).map((sale) => ({
      id: `sale-${sale.id}`,
      title: "New sale completed",
      detail: `${sale.item_count} item${sale.item_count === 1 ? "" : "s"} · ${formatMinorUnits(sale.total_minor, sale.currency)}`,
      time: sale.completed_at,
      tone: "sale" as const,
    }));
    const expenses = (recentQuery.data?.expenses ?? []).map((expense) => ({
      id: `expense-${expense.id}`,
      title: "Expense recorded",
      detail: `${expense.description} · ${formatMinorUnits(expense.amount_minor, expense.currency)}`,
      time: expense.expense_date,
      tone: "expense" as const,
    }));
    return [...sales, ...expenses]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [recentQuery.data]);

  async function invalidateDashboard() {
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["expenses"] });
    await queryClient.invalidateQueries({ queryKey: ["inventory"] });
    await queryClient.invalidateQueries({ queryKey: ["reports"] });
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

  const chartMax = Math.max(...salesBuckets.map((b) => b.total_minor), 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting}, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at {tenant?.name ?? "your business"} today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            {formatDisplayDate()}
          </span>
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQuickActionsOpen((open) => !open)}
            >
              Quick Actions
              <ChevronDown className="size-4" />
            </Button>
            {quickActionsOpen ? (
              <div className="glass-panel absolute top-full right-0 z-10 mt-2 min-w-[11rem] rounded-xl p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50"
                  onClick={() => {
                    setQuickActionsOpen(false);
                    setShowExpenseDialog(true);
                  }}
                >
                  <Receipt className="size-4" />
                  Record expense
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50"
                  onClick={() => {
                    setQuickActionsOpen(false);
                    setShowProductDialog(true);
                  }}
                >
                  <PackagePlus className="size-4" />
                  Add product
                </button>
              </div>
            ) : null}
          </div>
          <Link
            href="/pos"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-rich-teal px-5 py-2 text-sm font-medium text-brand-icy-orange transition-colors hover:bg-brand-rich-cyan"
          >
            <ShoppingBag className="size-4" />
            New Sale
          </Link>
        </div>
      </header>

      <ExpenseAndProductDialogs
        showExpenseDialog={showExpenseDialog}
        setShowExpenseDialog={setShowExpenseDialog}
        showProductDialog={showProductDialog}
        setShowProductDialog={setShowProductDialog}
        expenseError={expenseError}
        activeCategories={activeCategories}
        categoriesLoading={categoriesQuery.isLoading}
        expenseForm={expenseForm}
        onCreateExpense={onCreateExpense}
        onProductCreated={async () => {
          setShowProductDialog(false);
          await invalidateDashboard();
        }}
        onProductCancel={() => setShowProductDialog(false)}
      />

      {summaryQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-kpi h-32 rounded-2xl p-4">
              <div className="glass-shimmer h-3 w-20 rounded" />
              <div className="glass-shimmer mt-4 h-8 w-28 rounded" />
            </div>
          ))}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Sales"
            value={formatMinorUnits(summary.sales_total_minor, summary.currency)}
            sublabel={`${summary.sales_count} orders today`}
            accent="var(--brand-rich-teal)"
            icon={ArrowUpRight}
            sparkline={sparklineValues}
          />
          <MetricCard
            label="Total Expenses"
            value={formatMinorUnits(
              summary.expenses_total_minor,
              summary.currency,
            )}
            sublabel={`${summary.expenses_count} entries today`}
            accent="var(--brand-rich-cyan)"
            icon={ArrowDownRight}
            sparkline={sparklineValues.map((v) => Math.round(v * 0.35))}
          />
          <MetricCard
            label="Net Profit"
            value={formatMinorUnits(summary.net_position_minor, summary.currency)}
            sublabel="Sales − expenses"
            accent={netPositive ? "#0a9396" : "#b42318"}
            icon={Wallet}
            valueClassName={netPositive ? "text-brand-rich-teal" : "text-destructive"}
            sparkline={sparklineValues.map((v) => Math.round(v * 0.6))}
          />
          <MetricCard
            label="Low Stock Items"
            value={String(summary.low_stock_count)}
            sublabel={
              summary.low_stock_count > 0 ? "Needs attention" : "All levels OK"
            }
            accent={summary.low_stock_count > 0 ? "#d97706" : "var(--brand-light-jade)"}
            icon={AlertTriangle}
            href="/inventory"
            valueClassName={
              summary.low_stock_count > 0
                ? "text-amber-700 dark:text-amber-300"
                : undefined
            }
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <DashboardCard
          title="Sales Overview"
          action={
            <div className="flex gap-1 rounded-lg bg-muted/40 p-0.5">
              {(["7d", "30d", "90d"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setChartRange(range)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition",
                    chartRange === range
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          }
        >
          {!canReports ? (
            <p className="text-sm text-muted-foreground">
              Sales charts require reports access.
            </p>
          ) : salesChartQuery.isLoading ? (
            <DashboardSkeleton rows={4} />
          ) : salesBuckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sales in this period yet.
            </p>
          ) : (
            <div>
              <p className="mb-4 text-xs text-muted-foreground">
                Daily sales for the selected period
              </p>
              <div className="flex h-44 items-end gap-2">
                {salesBuckets.map((bucket) => {
                  const height = Math.max(
                    (bucket.total_minor / chartMax) * 100,
                    4,
                  );
                  const label = new Date(
                    `${bucket.period_start}T00:00:00`,
                  ).toLocaleDateString(undefined, {
                    weekday: "short",
                  });
                  return (
                    <div
                      key={bucket.period_start}
                      className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-brand-rich-cyan to-brand-rich-teal transition hover:opacity-90"
                        style={{ height: `${height}%` }}
                        title={formatMinorUnits(
                          bucket.total_minor,
                          salesChartQuery.data?.currency ?? currency,
                        )}
                      />
                      <span className="truncate text-[10px] text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent Activity"
          action={<ViewAllLink href="/reports" />}
        >
          {recentQuery.isLoading ? (
            <DashboardSkeleton rows={5} />
          ) : activityItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-4">
              {activityItems.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      item.tone === "sale"
                        ? "bg-brand-rich-teal/15 text-brand-rich-teal"
                        : "bg-brand-rich-cyan/15 text-brand-rich-cyan",
                    )}
                  >
                    {item.tone === "sale" ? (
                      <ShoppingBag className="size-3.5" />
                    ) : (
                      <Receipt className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(item.time).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardCard
          title="Top Selling Items"
          action={canReports ? <ViewAllLink href="/reports" /> : undefined}
        >
          {!canReports ? (
            <p className="text-sm text-muted-foreground">
              Product rankings require reports access.
            </p>
          ) : topProductsQuery.isLoading ? (
            <DashboardSkeleton rows={5} />
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((product, index) => {
                const qty = Number.parseFloat(product.quantity) || 0;
                const width = Math.max((qty / maxProductQty) * 100, 8);
                return (
                  <li key={product.product_id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">
                        <span className="mr-2 text-muted-foreground">
                          {index + 1}.
                        </span>
                        {product.product_name}
                      </span>
                      <span className="text-muted-foreground">
                        {qty} sold
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-rich-cyan to-brand-rich-teal"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="Stock Overview"
          action={canInventory ? <ViewAllLink href="/inventory" /> : undefined}
        >
          {!canInventory ? (
            <p className="text-sm text-muted-foreground">
              Stock overview requires inventory access.
            </p>
          ) : stockLevelsQuery.isLoading ? (
            <DashboardSkeleton rows={5} />
          ) : stockLevels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock levels yet.</p>
          ) : (
            <ul className="space-y-3">
              {stockLevels.map((level) => (
                <li
                  key={level.product_id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate font-medium">
                    {level.product_name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground">
                      {level.quantity_base} {level.base_unit.symbol}
                    </span>
                    <StatusBadge
                      tone={level.is_low_stock ? "warning" : "success"}
                    >
                      {level.is_low_stock ? "Low" : "Good"}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent Orders"
          action={<ViewAllLink href="/pos" />}
        >
          {recentQuery.isLoading ? (
            <DashboardSkeleton rows={5} />
          ) : (recentQuery.data?.sales.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Items</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuery.data?.sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-border/40">
                      <td className="py-2.5 font-medium">
                        #{sale.id.slice(0, 6)}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {sale.item_count}
                      </td>
                      <td className="py-2.5">
                        {formatMinorUnits(sale.total_minor, sale.currency)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge tone="success">Completed</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </div>

      {lowStock.length > 0 ? (
        <DashboardCard
          title="Low Stock Alerts"
          action={<ViewAllLink href="/inventory" />}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((row) => (
              <div
                key={row.product_id}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{row.product_name}</span>
                <span className="text-amber-700 dark:text-amber-300">
                  {row.quantity_base} {row.unit_symbol}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  accent,
  icon: Icon,
  sparkline,
  href,
  valueClassName,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  sparkline?: number[];
  href?: string;
  valueClassName?: string;
}) {
  const content = (
    <div
      className="glass-kpi h-full p-4"
      style={{ "--kpi-accent": accent } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold tracking-tight",
              valueClassName,
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
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
      {sparkline ? (
        <div className="mt-3 flex items-center justify-between pl-2">
          <MiniSparkline values={sparkline} color={accent} />
          <span className="flex items-center gap-1 text-xs text-brand-rich-teal">
            <TrendingUp className="size-3" />
            Today
          </span>
        </div>
      ) : href ? (
        <p className="mt-3 pl-2 text-xs text-brand-rich-teal">View →</p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

function ExpenseAndProductDialogs({
  showExpenseDialog,
  setShowExpenseDialog,
  showProductDialog,
  setShowProductDialog,
  expenseError,
  activeCategories,
  categoriesLoading,
  expenseForm,
  onCreateExpense,
  onProductCreated,
  onProductCancel,
}: {
  showExpenseDialog: boolean;
  setShowExpenseDialog: (open: boolean) => void;
  showProductDialog: boolean;
  setShowProductDialog: (open: boolean) => void;
  expenseError: string | null;
  activeCategories: { id: string; name: string }[];
  categoriesLoading: boolean;
  expenseForm: ReturnType<typeof useForm<ExpenseFormValues>>;
  onCreateExpense: (values: ExpenseFormValues) => Promise<void>;
  onProductCreated: () => Promise<void>;
  onProductCancel: () => void;
}) {
  return (
    <>
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
          {activeCategories.length === 0 && !categoriesLoading ? (
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
            onCancel={onProductCancel}
            onCreated={onProductCreated}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
