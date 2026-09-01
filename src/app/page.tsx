import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { JapanReadinessSection } from "@/components/marketing/japan-readiness-section";
import { JlptSection } from "@/components/marketing/jlpt-section";
import { LearningPreview } from "@/components/marketing/learning-preview";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <LearningPreview />
        <JlptSection />
        <JapanReadinessSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
