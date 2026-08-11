import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LandingViewTracker } from "@/components/LandingViewTracker";

export default function LandingPage() {
  const { heroTitle, heroSubheadline, ctaLabel, ctaMeta, problemHeadline, problemCopy, problemExamples, problemClosing } =
    siteConfig.landing;

  return (
    <main>
      <LandingViewTracker />

      <section className="bg-mahogany text-white px-6 py-24 md:py-32">
        <div className="max-w-content mx-auto text-center">
          <p className="label text-pearl/70 mb-6 text-xs md:text-sm">
            {siteConfig.brandName}
          </p>
          <h1 className="text-4xl md:text-6xl text-white mb-6 max-w-3xl mx-auto">
            {heroTitle}
          </h1>
          <p className="max-w-xl mx-auto text-pearl/90 text-lg md:text-xl mb-10">
            {heroSubheadline}
          </p>
          <Link href="/scan" className="btn-primary">
            {ctaLabel}
          </Link>
          <p className="label text-pearl/60 mt-5 text-[11px] md:text-xs">{ctaMeta}</p>
        </div>
      </section>

      <section className="bg-pearl px-6 py-20 md:py-28">
        <div className="max-w-content mx-auto">
          <h2 className="text-mahogany text-3xl md:text-5xl mb-8 whitespace-pre-line text-center">
            {problemHeadline}
          </h2>
          <p className="max-w-2xl mx-auto text-center text-lg mb-12">{problemCopy}</p>

          <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto mb-10">
            {problemExamples.map((example) => (
              <div
                key={example}
                className="bg-white border border-mahogany/10 rounded-2xl px-6 py-8 text-center"
              >
                <p className="text-lg">{example}</p>
              </div>
            ))}
          </div>

          <p className="text-center label text-chestnut text-sm">{problemClosing}</p>

          <div className="text-center mt-14">
            <Link href="/scan" className="btn-outline">
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
