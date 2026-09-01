import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-background py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/20 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10 blur-2xl"
          />

          <h2
            id="cta-heading"
            className="relative text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl"
          >
            Begin your Japanese journey today
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            Join Nihonini and take the first step toward fluency — whether
            you&apos;re preparing for the JLPT, moving to Japan, or exploring a
            new language.
          </p>
          <p className="relative mt-3 font-display text-xl text-primary-foreground/70">
            始めましょう！
          </p>
          <div className="relative mt-8">
            <Button
              size="lg"
              className="bg-foreground text-secondary hover:bg-foreground/90 focus-visible:ring-foreground/50"
            >
              Start Learning
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
