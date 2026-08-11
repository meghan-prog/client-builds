"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scanStorage } from "@/lib/storage";
import { ScanResult } from "@/lib/scoring";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { AcademyCTA } from "@/components/AcademyCTA";
import { ShareResultButton } from "@/components/ShareResultButton";

export default function ResultPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedResult = scanStorage.getResult<ScanResult>();
    const storedScanId = scanStorage.getScanId();
    setResult(storedResult);
    setScanId(storedScanId);
    setReady(true);

    if (storedResult) {
      trackEvent(
        "result_viewed",
        { primaryRoute: storedResult.primaryRoute },
        storedScanId ?? undefined
      );
    }
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pearl">
        <p className="label text-mahogany/50 text-sm">Even geduld…</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pearl px-6">
        <div className="max-w-md text-center bg-white border border-mahogany/10 rounded-3xl p-10">
          <h1 className="text-2xl text-mahogany mb-4">Geen resultaat gevonden</h1>
          <p className="mb-8">
            We konden geen scanresultaat vinden in deze sessie. Doe de scan opnieuw om je
            persoonlijke AI-income route te ontdekken.
          </p>
          <Link href="/scan" className="btn-primary">
            Start de scan
          </Link>
        </div>
      </main>
    );
  }

  const route = routes[result.primaryRoute];
  const matchPercentage = result.matchPercentages[result.primaryRoute];

  return (
    <main className="bg-pearl">
      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-content mx-auto text-center">
          <p className="label text-chestnut text-xs mb-4">Jouw beste AI-income route:</p>
          <h1 className="text-4xl md:text-6xl text-mahogany mb-6">{route.name}</h1>

          <div className="max-w-xs mx-auto mb-2">
            <div className="h-2.5 w-full bg-mahogany/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-chestnut rounded-full"
                style={{ width: `${matchPercentage}%` }}
              />
            </div>
          </div>
          <p className="label text-mahogany/60 text-xs">
            {route.name} — {matchPercentage}% match
          </p>
        </div>
      </section>

      <section className="px-6 pb-12 md:pb-16">
        <div className="max-w-content mx-auto bg-white border border-mahogany/10 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl text-mahogany mb-6">Waarom dit bij jou past</h2>
          <ul className="space-y-3">
            {result.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-chestnut mt-1">
                  —
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-12 md:pb-16">
        <div className="max-w-content mx-auto bg-white border border-mahogany/10 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl text-mahogany mb-5">Wat is deze route?</h2>
          <p className="mb-8">{route.description}</p>

          <div className="bg-pearl rounded-2xl p-6 md:p-8 border-l-4 border-chestnut">
            <p className="label text-chestnut text-xs mb-2">Voorbeeld</p>
            <h3 className="text-xl text-mahogany mb-2">{route.example.title}</h3>
            <p>{route.example.description}</p>
          </div>
          <p className="text-sm text-mahogany/50 mt-4">{siteConfig.disclaimer}</p>
        </div>
      </section>

      <section className="px-6 pb-12 md:pb-16">
        <div className="max-w-content mx-auto bg-white border border-mahogany/10 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl text-mahogany mb-5">Jouw eerste stap</h2>
          <p className="mb-8">{route.firstStep}</p>
          <a href="#academy" className="btn-outline">
            Bekijk jouw route in AI Income Academy →
          </a>
        </div>
      </section>

      <section id="academy" className="px-6 pb-16 md:pb-24">
        <div className="max-w-content mx-auto">
          <AcademyCTA scanId={scanId} />
        </div>
      </section>

      <section className="px-6 pb-20 text-center">
        <ShareResultButton route={route} scanId={scanId} />
      </section>
    </main>
  );
}
