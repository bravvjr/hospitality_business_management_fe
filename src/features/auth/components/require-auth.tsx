"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/slices/auth-slice";

/** Require an authenticated session for (app) routes. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

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

  return children;
}
