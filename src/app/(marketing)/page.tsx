import { CtaSection } from "@/features/marketing/components/cta-section";
import { FeaturesSection } from "@/features/marketing/components/features-section";
import { HeroSection } from "@/features/marketing/components/hero-section";
import { HowItWorksSection } from "@/features/marketing/components/how-it-works-section";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
