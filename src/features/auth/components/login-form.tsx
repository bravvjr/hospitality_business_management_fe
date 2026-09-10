"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { login } from "@/features/auth/api";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas";
import { ApiError } from "@/lib/api/client";
import { useAppDispatch } from "@/lib/store/hooks";
import { setSession } from "@/lib/store/slices/auth-slice";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const session = await login(values);
      dispatch(setSession(session));
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to log in. Check the API is running.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={fieldClassName}
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Continue"}
      </Button>

      <Link
        href="/register"
        className="text-center text-sm text-brand-rich-teal hover:underline"
      >
        Create an account
      </Link>
      <Link
        href="/"
        className="text-center text-sm text-muted-foreground hover:underline"
      >
        Back to home
      </Link>
    </form>
  );
}
