"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { logout as logoutRequest } from "@/features/auth/api";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  clearSession,
  selectIsAuthenticated,
} from "@/lib/store/slices/auth-slice";
import { Button } from "@/components/ui/button";

/** Require an authenticated session for (app) routes. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const tenant = useAppSelector((state) => state.auth.tenant);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Clear local session even if the API call fails.
    }
    dispatch(clearSession());
    router.replace("/login");
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-rich-teal">
            {tenant?.name ?? "HBM App"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </header>
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
