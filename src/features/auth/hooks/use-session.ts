"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMe } from "@/features/auth/api";

export const SESSION_QUERY_KEY = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
  });
}
