const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "JLPT", href: "#jlpt" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
              >
                日
              </span>
              <span className="text-lg font-bold text-foreground">Nihonini</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Learn Japanese. Prepare for Japan. A modern platform for foreigners
              studying, working, traveling, and living in Japan.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="text-sm font-semibold text-foreground">Explore</h2>
            <ul className="mt-4 space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              <span className="font-japanese">日本語</span> learning
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              From JLPT preparation to real-world Japanese for school, work, and
              daily life in Japan.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {year} Nihonini. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
