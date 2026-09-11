"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout as logoutRequest } from "@/features/auth/api";
import { navItemsForRole } from "@/lib/auth/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { clearSession } from "@/lib/store/slices/auth-slice";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tenant = useAppSelector((state) => state.auth.tenant);
  const membership = useAppSelector((state) => state.auth.membership);
  const navItems = membership
    ? navItemsForRole(membership.role.key)
    : [];

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Clear local session even if the API call fails.
    }
    dispatch(clearSession());
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="border-b border-border p-4">
          <p className="text-sm font-semibold text-brand-rich-teal">HBM Platform</p>
          {tenant ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {tenant.name}
            </p>
          ) : null}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 hover:bg-muted",
                pathname === item.href && "bg-muted font-medium",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6">
          <div className="min-w-0">
            {user ? (
              <>
                <p className="truncate text-sm font-medium">{user.email}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {membership?.role.name}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Signed out</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
