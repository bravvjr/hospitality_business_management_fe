import Link from "next/link";

import { siteContent } from "@/features/marketing/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-brand-deep-cyan px-6 py-12 text-brand-icy-orange/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-brand-icy-orange">{siteContent.brand}</p>
          <p className="mt-2 text-sm">{siteContent.footer.copyright}</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm">
          <Link href="#features" className="hover:text-brand-light-jade">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-brand-light-jade">
            How it works
          </Link>
          <Link href="/login" className="hover:text-brand-light-jade">
            Log in
          </Link>
          <Link href="/register" className="hover:text-brand-light-jade">
            Register
          </Link>
        </nav>
      </div>
    </footer>
  );
}
