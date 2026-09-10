import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mt-2 text-muted-foreground">
          Registration will create your tenant and owner account via the API. Coming next.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button disabled className="w-full">Get started</Button>
          <Link
            href="/login"
            className="text-center text-sm text-brand-rich-teal hover:underline"
          >
            Already have an account? Log in
          </Link>
          <Link href="/" className="text-center text-sm text-muted-foreground hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
