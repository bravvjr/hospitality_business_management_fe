import { siteContent } from "@/features/marketing/content";

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your team needs to operate
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One platform for daily hospitality operations — from the counter to the back office.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {siteContent.features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-brand-rich-teal/20 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 h-1 w-12 rounded-full bg-brand-gradient" />
              <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
