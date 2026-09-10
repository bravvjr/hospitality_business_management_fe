import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Log in</h1>
        <p className="mt-2 text-muted-foreground">
          Authentication will connect to the backend cookie session. Coming next.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button disabled className="w-full">Continue</Button>
          <Link
            href="/register"
            className="text-center text-sm text-brand-rich-teal hover:underline"
          >
            Create an account
          </Link>
          <Link href="/" className="text-center text-sm text-muted-foreground hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
