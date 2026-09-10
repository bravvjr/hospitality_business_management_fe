import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { siteContent } from "@/features/marketing/content";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-deep-cyan/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand-icy-orange">
          {siteContent.brand}
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-brand-icy-orange/90",
            )}
          >
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            {siteContent.hero.primaryCta}
          </Link>
        </nav>
      </div>
    </header>
  );
}
