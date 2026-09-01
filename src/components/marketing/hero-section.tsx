import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-secondary"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl text-muted-foreground sm:text-3xl">
            Your journey to Japan starts here
          </p>

          <h1
            id="hero-heading"
            className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Learn Japanese.
            <br />
            <span className="inline-block rounded-lg bg-primary/30 px-2 py-0.5">
              Prepare for Japan.{" "}
              <span role="img" aria-label="Japan flag">
                🇯🇵
              </span>
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Nihonini helps foreigners master Japanese for{" "}
            <strong className="font-medium text-foreground">JLPT exams</strong>,{" "}
            <strong className="font-medium text-foreground">study abroad</strong>,{" "}
            <strong className="font-medium text-foreground">work</strong>,{" "}
            <strong className="font-medium text-foreground">travel</strong>, and{" "}
            <strong className="font-medium text-foreground">life in Japan</strong>.
            Structured learning paths, real-world scenarios, and progress you can
            feel.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg">Start Learning</Button>
            <Button variant="secondary" size="lg">
              Explore Nihonini
            </Button>
          </div>

          <p className="mt-8 font-japanese text-sm text-muted-foreground">
            日本語を学んで、日本の準備をしよう
          </p>
        </div>
      </div>
    </section>
  );
}
