"use client";

import { TutorRecommendationCards } from "@/components/tutor/tutor-recommendation-cards";
import { TutorSuggestedAction } from "@/components/tutor/tutor-suggested-action";
import type { TutorResponse } from "@/types/tutor";

type TutorResponseContentProps = {
  response: TutorResponse;
};

function ExamplesBlock({
  examples,
}: {
  examples: NonNullable<Extract<TutorResponse, { examples?: unknown }>["examples"]>;
}) {
  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {examples.map((example, index) => (
        <div key={`${example.japanese}-${index}`} className="rounded-lg bg-background/60 p-2">
          <p className="font-japanese whitespace-pre-wrap text-foreground">{example.japanese}</p>
          {example.reading && (
            <p className="font-japanese text-xs text-muted-foreground">{example.reading}</p>
          )}
          <p className="text-muted-foreground">{example.meaning}</p>
        </div>
      ))}
    </div>
  );
}

function LegacyCorrectionsBlock({
  corrections,
}: {
  corrections: NonNullable<Extract<TutorResponse, { corrections?: unknown }>["corrections"]>;
}) {
  if (!corrections || corrections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {corrections.map((correction, index) => (
        <div key={`${correction.original}-${index}`} className="rounded-lg bg-background/60 p-2">
          <p className="font-japanese whitespace-pre-wrap text-foreground">{correction.original}</p>
          <p className="font-japanese whitespace-pre-wrap text-primary">→ {correction.corrected}</p>
          <p className="text-muted-foreground">{correction.note}</p>
        </div>
      ))}
    </div>
  );
}

export function TutorResponseContent({ response }: TutorResponseContentProps) {
  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3 text-sm">
      {"explanation" in response && response.explanation && (
        <p className="whitespace-pre-wrap text-muted-foreground">{response.explanation}</p>
      )}

      {response.type === "TRANSLATION" && (
        <div className="rounded-lg bg-background/60 p-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Translation
          </p>
          <p className="font-japanese mt-1 whitespace-pre-wrap text-foreground">
            {response.translation}
          </p>
        </div>
      )}

      {response.type === "CORRECTION" && "correction" in response && response.correction && (
        <div className="space-y-2">
          <div className="rounded-lg bg-background/60 p-2">
            <p className="font-japanese whitespace-pre-wrap text-foreground">
              {response.correction.original}
            </p>
            <p className="font-japanese whitespace-pre-wrap text-primary">
              → {response.correction.corrected}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {response.correction.overallExplanation}
            </p>
          </div>
          {response.correction.mistakes.map((mistake, index) => (
            <div key={`${mistake.category}-${index}`} className="rounded-lg bg-background/60 p-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {mistake.category.replaceAll("_", " ")}
              </p>
              <p className="font-japanese mt-1 whitespace-pre-wrap text-foreground">
                {mistake.original} → {mistake.correction}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{mistake.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {response.type === "CORRECTION" &&
        "corrections" in response &&
        response.corrections &&
        response.corrections.length > 0 && (
        <LegacyCorrectionsBlock corrections={response.corrections} />
      )}

      {response.type === "COMPARISON" && (
        <div className="space-y-2">
          <p className="text-muted-foreground">
            {response.comparison.itemA} vs {response.comparison.itemB}
          </p>
          {response.comparison.differences.map((difference, index) => (
            <div key={`${difference.aspect}-${index}`} className="rounded-lg bg-background/60 p-2">
              <p className="font-medium text-foreground">{difference.aspect}</p>
              <p className="font-japanese mt-1 whitespace-pre-wrap text-foreground">
                A: {difference.itemA}
              </p>
              <p className="font-japanese whitespace-pre-wrap text-foreground">
                B: {difference.itemB}
              </p>
            </div>
          ))}
        </div>
      )}

      {response.type === "RECOMMENDATION" && (
        <TutorRecommendationCards recommendations={response.recommendations} />
      )}

      {response.type === "PRACTICE" && (
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tutor practice · {response.practice.questionType.replaceAll("_", " ")}
            {"phase" in response.practice && response.practice.phase
              ? ` · ${response.practice.phase}`
              : ""}
            {"difficulty" in response.practice && response.practice.difficulty
              ? ` · ${response.practice.difficulty}`
              : ""}
          </p>

          {response.practice.phase === "COMPLETION" ? (
            <>
              <p className="mt-2 whitespace-pre-wrap text-foreground">{response.answer}</p>
              {response.practice.sessionSummary && (
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {response.practice.sessionSummary}
                </p>
              )}
            </>
          ) : response.practice.phase === "EVALUATION" ? (
            <>
              {response.practice.evaluation && (
                <p
                  className={`mt-2 font-medium ${
                    response.practice.evaluation.isCorrect ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {response.practice.evaluation.isCorrect ? "Correct" : "Not quite"}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-foreground">{response.answer}</p>
              {response.practice.evaluation?.feedback && (
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {response.practice.evaluation.feedback}
                </p>
              )}
              {response.practice.explanation && (
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {response.practice.explanation}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-japanese mt-2 whitespace-pre-wrap text-foreground">
                {response.practice.question}
              </p>
              {response.practice.choices && response.practice.choices.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {response.practice.choices.map((choice, index) => (
                    <li key={`${choice}-${index}`} className="font-japanese text-foreground">
                      {String.fromCharCode(65 + index)}. {choice}
                    </li>
                  ))}
                </ul>
              )}
              {response.practice.hint && (
                <p className="mt-2 text-xs text-muted-foreground">Hint: {response.practice.hint}</p>
              )}
              {response.practice.explanation && (
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {response.practice.explanation}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {"examples" in response && response.examples && response.examples.length > 0 && (
        <ExamplesBlock examples={response.examples} />
      )}

      {"relatedContent" in response &&
        response.relatedContent &&
        response.relatedContent.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {response.relatedContent.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                {item.kind}: {item.title}
              </li>
            ))}
          </ul>
        )}

      {"suggestedAction" in response && response.suggestedAction && (
        <TutorSuggestedAction action={response.suggestedAction} />
      )}
    </div>
  );
}
