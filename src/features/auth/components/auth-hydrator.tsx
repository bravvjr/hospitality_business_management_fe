"use client";

import { useEffect } from "react";

import { fetchMe } from "@/features/auth/api";
import { ApiError } from "@/lib/api/client";
import { useAppDispatch } from "@/lib/store/hooks";
import { clearSession, setSession } from "@/lib/store/slices/auth-slice";

/** Hydrate Redux auth from HttpOnly cookie session via GET /auth/me. */
export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const session = await fetchMe();
        if (!cancelled) {
          dispatch(setSession(session));
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            dispatch(clearSession());
          } else {
            // Network blip or server down — treat as logged out for route guards.
            dispatch(clearSession());
          }
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return children;
}
