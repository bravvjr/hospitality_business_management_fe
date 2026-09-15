"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  createExpense,
  createExpenseCategory,
  fetchExpenseSummary,
  listExpenseCategories,
  listExpenses,
  updateExpenseCategory,
} from "@/features/expenses/api";
import {
  categoryFormSchema,
  expenseFormSchema,
  type CategoryFormValues,
  type ExpenseFormValues,
} from "@/features/expenses/schemas";
import { ApiError } from "@/lib/api/client";
import { formatMinorUnits, parseMajorToMinor } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIsoDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export function ExpensesScreen() {
  const queryClient = useQueryClient();
  const tenantCurrency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );
  const [tab, setTab] = useState<"expenses" | "categories">("expenses");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(monthStartIsoDate);
  const [toDate, setToDate] = useState(todayIsoDate);

  const categoriesQuery = useQuery({
    queryKey: ["expenses", "categories"],
    queryFn: () => listExpenseCategories({ limit: 100 }),
  });
  const expensesQuery = useQuery({
    queryKey: ["expenses", "list", fromDate, toDate],
    queryFn: () =>
      listExpenses({ limit: 100, from: fromDate, to: toDate }),
  });
  const summaryQuery = useQuery({
    queryKey: ["expenses", "summary", fromDate, toDate, tenantCurrency],
    queryFn: () =>
      fetchExpenseSummary({
        from: fromDate,
        to: toDate,
        currency: tenantCurrency,
      }),
  });

  const categories = useMemo(
    () => categoriesQuery.data?.items ?? [],
    [categoriesQuery.data?.items],
  );
  const activeCategories = categories.filter((c) => c.status === "active");
  const expenses = expensesQuery.data?.items ?? [];

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["expenses"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category_id: "",
      amount_major: "",
      currency: tenantCurrency,
      description: "",
      expense_date: todayIsoDate(),
      note: "",
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "" },
  });

  async function onCreateExpense(values: ExpenseFormValues) {
    setActionError(null);
    const amountMinor = parseMajorToMinor(values.amount_major);
    if (amountMinor == null || amountMinor <= 0) {
      setActionError("Enter a valid amount");
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
        currency: tenantCurrency,
        description: "",
        expense_date: todayIsoDate(),
        note: "",
      });
      setShowExpenseForm(false);
      await invalidate();
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not save expense",
      );
    }
  }

  async function onCreateCategory(values: CategoryFormValues) {
    setActionError(null);
    try {
      await createExpenseCategory({ name: values.name.trim() });
      categoryForm.reset({ name: "" });
      setShowCategoryForm(false);
      await invalidate();
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not save category",
      );
    }
  }

  async function toggleCategory(categoryId: string, status: string) {
    setActionError(null);
    try {
      await updateExpenseCategory(categoryId, {
        status: status === "active" ? "inactive" : "active",
      });
      await invalidate();
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not update category",
      );
    }
  }

  return (
    <div className="space-y-6">
      <header className="glass-section flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Categories, entries, and period totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowExpenseForm(true)}>
            Record expense
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setTab("categories");
              setShowCategoryForm(true);
            }}
          >
            Add category
          </Button>
        </div>
      </header>

      {summaryQuery.data ? (
        <div className="glass-panel rounded-2xl p-4 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total {summaryQuery.data.from_date} → {summaryQuery.data.to_date}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {formatMinorUnits(
                summaryQuery.data.total_minor,
                summaryQuery.data.currency,
              )}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground sm:mt-0">
            {summaryQuery.data.expense_count} expense
            {summaryQuery.data.expense_count === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      {actionError ? (
        <p className="text-sm text-red-600">{actionError}</p>
      ) : null}

      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New expense</DialogTitle>
            <DialogDescription>
              Record a business expense against a category.
            </DialogDescription>
          </DialogHeader>
          {activeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create an active category first.
            </p>
          ) : (
            <form
              onSubmit={expenseForm.handleSubmit(onCreateExpense)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="category_id">
                  Category
                </label>
                <select
                  id="category_id"
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
                <label className="text-sm font-medium" htmlFor="amount_major">
                  Amount
                </label>
                <input
                  id="amount_major"
                  className={fieldClassName}
                  {...expenseForm.register("amount_major")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="currency">
                  Currency
                </label>
                <input
                  id="currency"
                  maxLength={3}
                  className={`${fieldClassName} uppercase`}
                  {...expenseForm.register("currency")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="description">
                  Description
                </label>
                <input
                  id="description"
                  className={fieldClassName}
                  {...expenseForm.register("description")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="expense_date">
                  Date
                </label>
                <input
                  id="expense_date"
                  type="date"
                  className={fieldClassName}
                  {...expenseForm.register("expense_date")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="note">
                  Note
                </label>
                <input
                  id="note"
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
                  onClick={() => setShowExpenseForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Group expenses under a named category.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={categoryForm.handleSubmit(onCreateCategory)}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="text-sm font-medium" htmlFor="cat-name">
                Name
              </label>
              <input
                id="cat-name"
                className={fieldClassName}
                {...categoryForm.register("name")}
              />
            </div>
            <Button type="submit" disabled={categoryForm.formState.isSubmitting}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCategoryForm(false)}
            >
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 border-b border-border/60">
        {(
          [
            ["expenses", "Entries"],
            ["categories", "Categories"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === key
                ? "border-brand-rich-teal text-brand-rich-teal"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "expenses" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="from">
                From
              </label>
              <input
                id="from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="to">
                To
              </label>
              <input
                id="to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>
          {expensesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading expenses…</p>
          ) : null}
          {!expensesQuery.isLoading && expenses.length === 0 ? (
            <p className="glass-panel rounded-xl border-dashed p-6 text-sm text-muted-foreground">
              No expenses in this range.
            </p>
          ) : (
            <div className="glass-panel overflow-x-auto rounded-xl">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-border">
                      <td className="px-3 py-2">{expense.expense_date}</td>
                      <td className="px-3 py-2 font-medium">
                        {expense.description}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {expense.category.name}
                      </td>
                      <td className="px-3 py-2">
                        {formatMinorUnits(
                          expense.amount_minor,
                          expense.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section>
          {categoriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : null}
          {!categoriesQuery.isLoading && categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No categories yet.
            </p>
          ) : (
            <ul className="glass-panel divide-y divide-border/60 rounded-xl">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="capitalize text-xs text-muted-foreground">
                      {category.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-brand-rich-teal hover:underline"
                    onClick={() =>
                      void toggleCategory(category.id, category.status)
                    }
                  >
                    {category.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
