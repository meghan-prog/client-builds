"use client";

import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

export function AcademyCTA({ scanId }: { scanId: string | null }) {
  const { academy } = siteConfig;

  function handleClick() {
    trackEvent("academy_cta_clicked", { route: undefined }, scanId ?? undefined);
  }

  return (
    <section className="bg-mahogany text-white rounded-3xl px-6 py-12 md:px-14 md:py-16">
      <p className="label text-pearl/70 mb-4 text-center text-xs">{academy.name}</p>
      <h2 className="text-3xl md:text-4xl text-white text-center mb-6">
        {academy.ctaHeadline}
      </h2>
      <p className="max-w-xl mx-auto text-center text-pearl/90 mb-10">{academy.ctaCopy}</p>

      <div className="bg-white/5 border border-white/15 rounded-2xl p-6 md:p-8 max-w-md mx-auto mb-10">
        <div className="text-center mb-6">
          <p className="label text-pearl/60 text-xs mb-1">{academy.name}</p>
          <p className="text-4xl font-heading">{academy.price}</p>
        </div>
        <ul className="space-y-2.5">
          {academy.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-pearl/90 text-sm">
              <span aria-hidden="true" className="text-chestnut mt-0.5">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <a
          href={academy.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="btn-primary"
        >
          {academy.ctaButtonLabel}
        </a>
      </div>
    </section>
  );
}
