"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "@/components/learning/listening/listening-audio-player";
import { MockExamTimer } from "@/components/learning/mock-exam/mock-exam-timer";
import {
  saveMockExamAnswerAction,
  submitMockExamSessionAction,
} from "@/server/learning/mock-exam.actions";
import type { MockExamResult, MockExamSessionState } from "@/types/learning";

type MockExamSessionProps = {
  initialState: MockExamSessionState;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function MockExamSession({ initialState }: MockExamSessionProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = state.questions[currentIndex];
  const currentSection = useMemo(
    () => state.sections.find((section) => section.id === currentQuestion.sectionId),
    [state.sections, currentQuestion.sectionId],
  );

  const unansweredCount = state.totalCount - state.answeredCount;

  const handleSelect = (optionId: string) => {
    if (currentQuestion.selectedOptionId === optionId) return;

    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === currentQuestion.id
          ? { ...question, selectedOptionId: optionId }
          : question,
      ),
      answeredCount:
        currentQuestion.selectedOptionId === null
          ? prev.answeredCount + 1
          : prev.answeredCount,
    }));

    setSaveState("saving");
    setSaveError(null);

    startTransition(async () => {
      const response = await saveMockExamAnswerAction({
        sessionId: state.sessionId,
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
      });

      if ("error" in response) {
        setSaveState("error");
        setSaveError(response.error);
        return;
      }

      setSaveState("saved");
    });
  };

  const handleSubmit = () => {
    setSubmitError(null);
    startTransition(async () => {
      const response = await submitMockExamSessionAction({
        sessionId: state.sessionId,
      });

      if ("error" in response) {
        setSubmitError(response.error);
        return;
      }

      setResult(response);
      setShowConfirm(false);
      router.refresh();
    });
  };

  if (result && !showReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{result.scoreLabel}</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">{result.examTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.status === "EXPIRED" ? "Time expired" : "Completed"}
          </p>
          <p className="mt-6 text-4xl font-bold text-foreground">{result.scorePercent}%</p>
          <p className="mt-2 text-lg text-muted-foreground">
            {result.correctCount} / {result.totalCount} correct
          </p>
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-foreground">Section performance</p>
            {result.sectionPerformance.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="text-foreground">{section.title}</span>
                <span className="font-medium text-foreground">{section.scorePercent}%</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setShowReview(true)}>
              Review answers
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/app/exams")}
            >
              Back to exams
            </Button>
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
            {result.correctCount} / {result.totalCount} correct · {result.scorePercent}%
          </p>
        </section>
        <ol className="space-y-4">
          {result.answers.map((answer, index) => (
            <li
              key={answer.questionId}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-muted-foreground">Question {index + 1}</p>
              <p className="mt-2 font-medium text-foreground">{answer.questionText}</p>
              <div
                className={cn(
                  "mt-4 flex items-start gap-3 rounded-lg px-4 py-3",
                  answer.isCorrect ? "bg-success/10" : "bg-error/10",
                )}
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
                    <span className="font-medium text-foreground">
                      {answer.selectedOptionText ?? "No answer"}
                    </span>
                  </p>
                  {!answer.isCorrect && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Correct answer:{" "}
                      <span className="font-medium text-foreground">
                        {answer.correctOptionText}
                      </span>
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
        <Button type="button" variant="secondary" onClick={() => router.push("/app/exams")}>
          Back to exams
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{state.exam.jlptLevel}</p>
          <h1 className="text-2xl font-bold text-foreground">{state.exam.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Section: {currentSection?.title ?? "Exam"}
          </p>
        </div>
        <div className="w-full max-w-xs">
          <MockExamTimer expiresAt={state.expiresAt} serverNow={state.serverNow} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">Questions</p>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">
            {state.questions.map((question, index) => {
              const answered = question.selectedOptionId !== null;
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                    index === currentIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-foreground hover:bg-muted",
                  )}
                  aria-label={`Question ${index + 1}${answered ? ", answered" : ", unanswered"}`}
                >
                  {answered ? "✓" : index + 1}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
          {currentSection?.readingPassage && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              {currentSection.readingTitle && (
                <h2 className="text-lg font-semibold text-foreground">
                  {currentSection.readingTitle}
                </h2>
              )}
              <p className="mt-3 whitespace-pre-wrap font-japanese text-base leading-relaxed text-foreground">
                {currentSection.readingPassage}
              </p>
            </section>
          )}

          {currentSection?.listeningAudioUrl && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              {currentSection.listeningTitle && (
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {currentSection.listeningTitle}
                </h2>
              )}
              <ListeningAudioPlayer
                audioUrl={currentSection.listeningAudioUrl}
                title={currentSection.listeningTitle ?? "Listening audio"}
                durationSeconds={currentSection.listeningDurationSeconds}
              />
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Question {currentIndex + 1} of {state.totalCount}
            </p>
            <p className="mt-3 text-lg font-medium text-foreground">{currentQuestion.questionText}</p>

            <div className="mt-5 space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  disabled={isPending}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    currentQuestion.selectedOptionId === option.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-foreground hover:bg-muted",
                  )}
                >
                  {option.text}
                </button>
              ))}
            </div>

            <div className="mt-4 text-sm text-muted-foreground" aria-live="polite">
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && (
                <span className="text-error">
                  Unable to save answer. {saveError ?? "Try again."}
                </span>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={currentIndex === 0 || isPending}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={currentIndex >= state.totalCount - 1 || isPending}
              onClick={() =>
                setCurrentIndex((index) => Math.min(state.totalCount - 1, index + 1))
              }
            >
              Next
            </Button>
            <Button type="button" onClick={() => setShowConfirm(true)} disabled={isPending}>
              Submit exam
            </Button>
          </div>

          {submitError && <p className="text-sm text-error">{submitError}</p>}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-exam-title"
          >
            <h2 id="submit-exam-title" className="text-xl font-bold text-foreground">
              Submit exam?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You have answered {state.answeredCount} of {state.totalCount} questions.
            </p>
            {unansweredCount > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {unansweredCount} question{unansweredCount === 1 ? "" : "s"} remain unanswered.
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Are you sure?</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowConfirm(false)}>
                Continue exam
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Submitting..." : "Submit exam"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
