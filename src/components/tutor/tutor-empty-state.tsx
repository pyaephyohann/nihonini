import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TutorEmptyStateProps = {
  disabled?: boolean;
};

export function TutorEmptyState({ disabled = false }: TutorEmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <p className="font-display text-2xl text-muted-foreground">日本語 Tutor</p>
      <h2 className="mt-3 text-xl font-semibold text-foreground">
        Ask your Japanese tutor
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Get help with grammar, vocabulary, kanji, sentence corrections, and study
        suggestions tailored to your JLPT level.
      </p>
      {disabled ? (
        <p className="mt-6 text-sm text-muted-foreground">
          The tutor is currently disabled.
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Type a question below or start a new conversation.
        </p>
      )}
      {!disabled && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-3 py-1">
            Explain は vs が
          </span>
          <span className="rounded-full border border-border px-3 py-1">
            Correct my sentence
          </span>
          <span className="rounded-full border border-border px-3 py-1">
            What does 頑張る mean?
          </span>
        </div>
      )}
      <Link href="/app/learn" className="mt-6">
        <Button variant="secondary" size="sm">
          Back to learning
        </Button>
      </Link>
    </Card>
  );
}
