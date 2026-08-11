"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { questions } from "@/config/questions";
import { computeResult } from "@/lib/scoring";
import { scanStorage } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/QuestionCard";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { siteConfig } from "@/config/site";

type Phase = "loading" | "questions" | "lead" | "finishing";

export default function ScanPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [scanId, setScanId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    async function init() {
      const existingScanId = scanStorage.getScanId();
      const existingAnswers = scanStorage.getAnswers();
      const existingResult = scanStorage.getResult();

      // Al een afgerond resultaat in deze sessie? Stuur door in plaats van
      // opnieuw te beginnen.
      if (existingResult && existingScanId) {
        router.replace("/result");
        return;
      }

      if (existingScanId) {
        setScanId(existingScanId);
        setAnswers(existingAnswers);
        const answeredCount = Object.keys(existingAnswers).length;
        setCurrentIndex(Math.min(answeredCount, questions.length - 1));
        setPhase("questions");
        return;
      }

      try {
        const res = await fetch("/api/scan/start", { method: "POST" });
        const data = await res.json();
        scanStorage.setScanId(data.scanId);
        setScanId(data.scanId);
      } catch {
        // Ook zonder backend-verbinding moet de scan gewoon werken —
        // gebruik een lokaal gegenereerd id als fallback.
        const fallbackId = crypto.randomUUID();
        scanStorage.setScanId(fallbackId);
        setScanId(fallbackId);
      }
      setPhase("questions");
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "loading" || !scanId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pearl">
        <p className="label text-mahogany/50 text-sm">Even geduld…</p>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOptionId = answers[currentQuestion?.id] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;

  function handleSelect(optionId: string) {
    const next = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(next);
    scanStorage.setAnswers(next);
    trackEvent("question_answered", { questionId: currentQuestion.id, optionId }, scanId ?? undefined);
  }

  async function handleNext() {
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    setPhase("finishing");
    const result = computeResult(answers);
    scanStorage.setResult(result);

    fetch("/api/scan/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId, answers }),
      keepalive: true,
    }).catch(() => {});

    if (siteConfig.leadCapture.enabled) {
      setPhase("lead");
    } else {
      router.push("/result");
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen bg-pearl flex flex-col">
      <div className="px-5 pt-6 md:pt-10 max-w-2xl mx-auto w-full">
        {phase === "questions" && <ProgressBar current={currentIndex + 1} total={questions.length} />}
      </div>

      <div className="flex-1 flex items-center px-5 py-8">
        <div className="max-w-2xl mx-auto w-full bg-white border border-mahogany/10 rounded-3xl p-6 md:p-10">
          {phase === "questions" && (
            <>
              <QuestionCard
                question={currentQuestion}
                selectedOptionId={selectedOptionId}
                onSelect={handleSelect}
              />
              <div className="flex items-center justify-between mt-9">
                <button type="button" onClick={handleBack} className="label text-mahogany/50 text-xs">
                  ← Terug
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedOptionId}
                  className="btn-primary"
                >
                  {isLastQuestion ? "Bekijk mijn resultaat →" : "Volgende →"}
                </button>
              </div>
            </>
          )}

          {phase === "finishing" && (
            <div className="text-center py-10">
              <p className="label text-mahogany/50 text-sm">Je resultaat wordt berekend…</p>
            </div>
          )}

          {phase === "lead" && scanId && (
            <LeadCaptureForm scanId={scanId} onSubmitted={() => router.push("/result")} />
          )}
        </div>
      </div>
    </main>
  );
}
