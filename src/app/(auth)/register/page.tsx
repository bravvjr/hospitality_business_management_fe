"use client";

import { GuestOnly } from "@/features/auth/components/guest-only";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <GuestOnly>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-muted-foreground">
            Sets up your business tenant and owner login in one step.
          </p>
          <RegisterForm />
        </div>
      </div>
    </GuestOnly>
  );
}
