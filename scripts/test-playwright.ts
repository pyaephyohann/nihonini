/**
 * Playwright bootstrap placeholder.
 *
 * NOTE: This project intentionally does NOT depend on `@playwright/test`.
 * Its QA harness is tsx-based (see `scripts/*-qa.ts`), and the dependency is
 * only an *optional* peer dependency of Next.js, so it is never installed.
 *
 * If a real Playwright suite is introduced later, install it explicitly:
 *   npm install --save-dev @playwright/test
 * then replace this file with the actual test bootstrap.
 */
console.log("Playwright suite is not installed in this project; nothing to run.");
