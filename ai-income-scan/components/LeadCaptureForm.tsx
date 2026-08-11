"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

interface Props {
  scanId: string;
  onSubmitted: () => void;
}

export function LeadCaptureForm({ scanId, onSubmitted }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !email.trim()) {
      setError("Vul je voornaam en e-mailadres in.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, firstName: firstName.trim(), email: email.trim() }),
      });
      if (!res.ok) {
        setError("Dat lukte niet. Controleer je e-mailadres en probeer opnieuw.");
        setSubmitting(false);
        return;
      }
      trackEvent("lead_submitted", {}, scanId);
      onSubmitted();
    } catch {
      setError("Dat lukte niet. Controleer je internetverbinding en probeer opnieuw.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in max-w-md mx-auto">
      <h2 className="text-2xl md:text-3xl text-mahogany mb-7 text-center">
        {siteConfig.leadCapture.headline}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Voornaam"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border border-mahogany/20 rounded-xl px-4 py-3.5 bg-white focus:outline-none focus:border-chestnut text-mahogany"
          autoComplete="given-name"
        />
        <input
          type="email"
          placeholder="E-mailadres"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-mahogany/20 rounded-xl px-4 py-3.5 bg-white focus:outline-none focus:border-chestnut text-mahogany"
          autoComplete="email"
        />
        {error && <p className="text-chestnut text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Even geduld…" : siteConfig.leadCapture.ctaLabel}
        </button>
      </form>
    </div>
  );
}
