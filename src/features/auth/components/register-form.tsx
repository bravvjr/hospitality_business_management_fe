"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { register as registerAccount } from "@/features/auth/api";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";
import { ApiError } from "@/lib/api/client";
import { useAppDispatch } from "@/lib/store/hooks";
import { setSession } from "@/lib/store/slices/auth-slice";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      tenant_name: "",
      base_currency: "KES",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      const session = await registerAccount({
        email: values.email,
        password: values.password,
        tenant_name: values.tenant_name,
        base_currency: values.base_currency,
      });
      dispatch(setSession(session));
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to register. Check the API is running.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      <div>
        <label
          htmlFor="tenant_name"
          className="text-sm font-medium text-foreground"
        >
          Business name
        </label>
        <input
          id="tenant_name"
          type="text"
          autoComplete="organization"
          className={fieldClassName}
          {...register("tenant_name")}
        />
        {errors.tenant_name ? (
          <p className="mt-1 text-sm text-red-600">
            {errors.tenant_name.message}
          </p>
        ) : null}
      </div>

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
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={fieldClassName}
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="base_currency"
          className="text-sm font-medium text-foreground"
        >
          Base currency
        </label>
        <input
          id="base_currency"
          type="text"
          maxLength={3}
          className={`${fieldClassName} uppercase`}
          {...register("base_currency")}
        />
        {errors.base_currency ? (
          <p className="mt-1 text-sm text-red-600">
            {errors.base_currency.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Get started"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-brand-rich-teal hover:underline"
      >
        Already have an account? Log in
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
