import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <p className="font-display text-2xl text-muted-foreground">
        ページが見つかりません
      </p>
      <h1 className="mt-4 text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button>Back to Nihonini</Button>
        </Link>
      </div>
    </div>
  );
}
