import { apiFetch } from "@/lib/api/client";
import type { Page } from "@/features/inventory/types";

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  category_id: string;
  category: ExpenseCategory;
  amount_minor: number;
  currency: string;
  description: string;
  expense_date: string;
  recorded_by_user_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummary {
  currency: string;
  total_minor: number;
  expense_count: number;
  from_date: string;
  to_date: string;
}

export function listExpenseCategories(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<ExpenseCategory>> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  return apiFetch<Page<ExpenseCategory>>(
    `/api/v1/expenses/categories?limit=${limit}&offset=${offset}`,
  );
}

export function createExpenseCategory(payload: {
  name: string;
}): Promise<ExpenseCategory> {
  return apiFetch<ExpenseCategory>("/api/v1/expenses/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpenseCategory(
  categoryId: string,
  payload: { name?: string; status?: "active" | "inactive" },
): Promise<ExpenseCategory> {
  return apiFetch<ExpenseCategory>(
    `/api/v1/expenses/categories/${categoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function listExpenses(params?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  from?: string;
  to?: string;
}): Promise<Page<Expense>> {
  const query = new URLSearchParams({
    limit: String(params?.limit ?? 50),
    offset: String(params?.offset ?? 0),
  });
  if (params?.categoryId) query.set("category_id", params.categoryId);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  return apiFetch<Page<Expense>>(
    `/api/v1/expenses/expenses?${query.toString()}`,
  );
}

export function createExpense(payload: {
  category_id: string;
  amount_minor: number;
  currency: string;
  description: string;
  expense_date: string;
  note?: string | null;
}): Promise<Expense> {
  return apiFetch<Expense>("/api/v1/expenses/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchExpenseSummary(params: {
  from: string;
  to: string;
  currency?: string;
}): Promise<ExpenseSummary> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.currency) query.set("currency", params.currency);
  return apiFetch<ExpenseSummary>(
    `/api/v1/expenses/summary?${query.toString()}`,
  );
}
