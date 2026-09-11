"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  login,
  logout,
  register,
} from "@/features/auth/api";
import type { LoginRequest, RegisterRequest } from "@/features/auth/types";
import { SESSION_QUERY_KEY } from "@/features/auth/hooks/use-session";
import { useAppDispatch } from "@/lib/store/hooks";
import { resetAuth, setSession } from "@/lib/store/slices/auth-slice";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (session) => {
      dispatch(setSession(session));
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
    onSuccess: (session) => {
      dispatch(setSession(session));
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      dispatch(resetAuth());
      router.push("/login");
    },
  });
}
