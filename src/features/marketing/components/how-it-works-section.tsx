import { siteContent } from "@/features/marketing/content";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/40 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          How it works
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Go from setup to daily operations in three straightforward steps.
        </p>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {siteContent.howItWorks.map((item) => (
            <li key={item.step} className="relative rounded-2xl border border-border bg-card p-6">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-rich-teal text-sm font-bold text-brand-icy-orange"
                aria-hidden
              >
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
