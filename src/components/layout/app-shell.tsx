"use client";

import {
  BarChart3,
  Bell,
  ChefHat,
  LayoutDashboard,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Soup,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout as logoutRequest } from "@/features/auth/api";
import { navItemsForRole, type NavItem } from "@/lib/auth/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { clearSession } from "@/lib/store/slices/auth-slice";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/pos": ShoppingCart,
  "/kitchen": ChefHat,
  "/inventory": Package,
  "/recipes": Soup,
  "/expenses": Receipt,
  "/reports": BarChart3,
  "/settings/staff": Users,
};

function userInitials(email: string | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-rich-teal text-brand-icy-orange shadow-sm"
          : "text-brand-light-jade/80 hover:bg-white/5 hover:text-brand-icy-orange",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tenant = useAppSelector((state) => state.auth.tenant);
  const membership = useAppSelector((state) => state.auth.membership);
  const navItems = membership ? navItemsForRole(membership.role.key) : [];

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Clear local session even if the API call fails.
    }
    dispatch(clearSession());
    router.replace("/login");
  }

  const displayName = user?.email?.split("@")[0] ?? "User";
  const initials = userInitials(user?.email);

  return (
    <div className="flex min-h-screen bg-[#eef5f3] dark:bg-[#001219]">
      <aside className="hidden w-60 shrink-0 flex-col bg-brand-deep-cyan text-brand-icy-orange md:flex">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-rich-teal/20 text-brand-light-jade">
              <Package className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {tenant?.name ?? "HBM Platform"}
              </p>
              <p className="truncate text-xs text-brand-light-jade/70">
                Business management
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="truncate text-xs text-brand-light-jade/70">Branch</p>
            <p className="truncate text-sm font-medium">
              {tenant?.name ?? "Main branch"}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle
              className="text-brand-light-jade hover:bg-white/10 hover:text-brand-icy-orange"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-brand-light-jade hover:bg-white/10 hover:text-brand-icy-orange"
              onClick={() => void handleLogout()}
            >
              Log out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-surface sticky top-0 z-20 flex items-center gap-4 border-b px-4 py-3 md:px-6">
          <label className="relative hidden min-w-0 flex-1 sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anything…"
              className="w-full max-w-xl rounded-xl border border-border/60 bg-background/70 py-2.5 pr-4 pl-10 text-sm outline-none ring-ring backdrop-blur-sm focus:ring-2"
            />
          </label>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-xl p-2 text-muted-foreground transition hover:bg-muted/60"
              aria-label="Notifications"
            >
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
              <Bell className="size-4" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-2 py-1.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-rich-teal text-xs font-semibold text-brand-icy-orange">
                {initials}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium capitalize">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {membership?.role.name ?? "Member"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
