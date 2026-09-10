import { apiFetch } from "@/lib/api/client";

import type {
  LoginRequest,
  RegisterRequest,
  SessionRead,
} from "./types";

export function login(payload: LoginRequest): Promise<SessionRead> {
  return apiFetch<SessionRead>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterRequest): Promise<SessionRead> {
  return apiFetch<SessionRead>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMe(): Promise<SessionRead> {
  return apiFetch<SessionRead>("/api/v1/auth/me");
}

export function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
  });
}
