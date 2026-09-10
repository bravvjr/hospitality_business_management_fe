import Link from "next/link";

import { RequireAuth } from "@/features/auth/components/require-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card p-4 md:block">
        <p className="mb-6 text-sm font-semibold text-brand-rich-teal">HBM App</p>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-muted">
            Dashboard
          </Link>
          <Link href="/pos" className="rounded-md px-3 py-2 hover:bg-muted">
            POS
          </Link>
          <Link href="/inventory" className="rounded-md px-3 py-2 hover:bg-muted">
            Inventory
          </Link>
          <Link href="/expenses" className="rounded-md px-3 py-2 hover:bg-muted">
            Expenses
          </Link>
          <Link href="/reports" className="rounded-md px-3 py-2 hover:bg-muted">
            Reports
          </Link>
          <Link
            href="/settings/staff"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            Staff
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </RequireAuth>
  );
}
