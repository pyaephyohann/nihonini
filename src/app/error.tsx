"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <p className="font-display text-2xl text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="mt-4 text-4xl font-bold text-foreground">
        An error occurred
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        We&apos;re sorry — something unexpected happened. Please try again.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Back to Nihonini</Button>
        </Link>
      </div>
    </div>
  );
}
