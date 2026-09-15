"use client";

import { GuestOnly } from "@/features/auth/components/guest-only";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <GuestOnly>
      <div className="flex min-h-screen flex-col items-center justify-center bg-app-gradient px-6">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-foreground">Log in</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with your business account. Session cookies stay on the API.
          </p>
          <LoginForm />
        </div>
      </div>
    </GuestOnly>
  );
}
