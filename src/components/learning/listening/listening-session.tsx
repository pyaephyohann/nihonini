"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "@/components/learning/listening/listening-audio-player";
import { submitListeningAnswersAction } from "@/server/learning/listening.actions";
import type { ListeningDetail, ListeningSubmissionResult } from "@/types/learning";

type ListeningSessionProps = {
  listening: ListeningDetail;
};

export function ListeningSession({ listening }: ListeningSessionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<ListeningSubmissionResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const questions = listening.questions;
  const currentQuestion = questions[currentIndex];
  const allAnswered = questions.every((question) => answers[question.id]);

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const response = await submitListeningAnswersAction({
        listeningId: listening.id,
        answers: questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: answers[question.id],
        })),
      });

      if ("error" in response) {
        setError(response.error);
        return;
      }

      setResult(response);
    });
  };

  const backLinkClass =
    "inline-flex items-center justify-center rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2";

  if (result && !showReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Listening complete</h2>
          <p className="mt-2 text-muted-foreground">{listening.title}</p>
          <p className="mt-6 text-4xl font-bold text-foreground">
            {result.correctCount} / {result.totalCount} correct
          </p>
          <p className="mt-2 text-lg text-muted-foreground">{result.scorePercent}% accuracy</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Listening mastery updated to {result.masteryPercent}%
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setShowReview(true)}>
              Review answers
            </Button>
            <Link href="/app/learn/listening" className={backLinkClass}>
              Back to listening
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (result && showReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Answer review</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.correctCount} / {result.totalCount} correct · {result.scorePercent}% accuracy
          </p>
        </section>

        <ol className="space-y-4">
          {result.answers.map((answer, index) => (
            <li
              key={answer.questionId}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-muted-foreground">Question {index + 1}</p>
              <p className="mt-2 font-medium text-foreground">{answer.question}</p>
              <div
                className={cn(
                  "mt-4 flex items-start gap-3 rounded-lg px-4 py-3",
                  answer.isCorrect ? "bg-success/10" : "bg-error/10",
                )}
                role="status"
              >
                {answer.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {answer.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your answer:{" "}
                    <span className="font-medium text-foreground">{answer.selectedOptionText}</span>
                  </p>
                  {!answer.isCorrect && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Correct answer:{" "}
                      <span className="font-medium text-foreground">{answer.correctOptionText}</span>
                    </p>
                  )}
                  {answer.explanation && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {answer.explanation}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {result.transcript && (
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTranscript((value) => !value)}
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </Button>
            {showTranscript && (
              <div className="mt-4 space-y-2">
                {result.transcript.split("\n").map((line, index) => (
                  <p key={`${index}-${line}`} className="font-japanese text-base leading-7 text-foreground">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowReview(false)}>
            Back to summary
          </Button>
          <Link href="/app/learn/listening" className={backLinkClass}>
            Back to listening
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ListeningAudioPlayer
        audioUrl={listening.audioUrl}
        title={listening.title}
        durationSeconds={listening.durationSeconds}
      />

      <section aria-labelledby="questions-heading" className="space-y-4">
        <div>
          <h2 id="questions-heading" className="text-xl font-bold text-foreground">
            Questions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Question {currentIndex + 1} / {questions.length}
          </p>
        </div>

        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-base font-medium text-foreground">{currentQuestion.question}</p>

          <fieldset className="mt-4">
            <legend className="sr-only">Choose an answer</legend>
            <ul className="space-y-2" role="list">
              {currentQuestion.options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(currentQuestion.id, option.id)}
                    aria-pressed={answers[currentQuestion.id] === option.id}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      answers[currentQuestion.id] === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:bg-muted",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 rounded-full border",
                        answers[currentQuestion.id] === option.id
                          ? "border-primary bg-primary"
                          : "border-border",
                      )}
                    />
                    <span>{option.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        </article>

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((value) => value - 1)}
          >
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              type="button"
              disabled={!answers[currentQuestion.id]}
              onClick={() => setCurrentIndex((value) => value + 1)}
            >
              Next
            </Button>
          ) : (
            <Button type="button" disabled={!allAnswered || isPending} onClick={handleSubmit}>
              {isPending ? "Submitting..." : "Submit listening"}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
