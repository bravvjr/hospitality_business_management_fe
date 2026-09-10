import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { siteContent } from "@/features/marketing/content";

export function HeroSection() {
  return (
    <section className="brand-gradient relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-brand-deep-cyan/20" />
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-light-jade">
          {siteContent.tagline}
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-brand-icy-orange sm:text-5xl lg:text-6xl">
          {siteContent.hero.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-icy-orange/85 sm:text-xl">
          {siteContent.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            {siteContent.hero.primaryCta}
          </Link>
          <Link
            href="#how-it-works"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {siteContent.hero.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
