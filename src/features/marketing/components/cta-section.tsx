import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { siteContent } from "@/features/marketing/content";

export function CtaSection() {
  return (
    <section className="brand-gradient px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-brand-icy-orange sm:text-4xl">
          {siteContent.cta.title}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-brand-icy-orange/85">
          {siteContent.cta.subtitle}
        </p>
        <div className="mt-8">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            {siteContent.cta.button}
          </Link>
        </div>
      </div>
    </section>
  );
}
