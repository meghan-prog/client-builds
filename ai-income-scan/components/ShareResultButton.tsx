"use client";

import { useState } from "react";
import { Route } from "@/config/routes";
import { trackEvent } from "@/lib/analytics";

export function ShareResultButton({ route, scanId }: { route: Route; scanId: string | null }) {
  const [copied, setCopied] = useState(false);

  const shareText = `Mijn AI-income route is: ${route.name}.\nOntdek die van jou via AI Income Scan.`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
        trackEvent("result_shared", { method: "web_share", route: route.id }, scanId ?? undefined);
      } catch {
        // gebruiker annuleerde het deel-venster — geen actie nodig
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      trackEvent("result_shared", { method: "clipboard", route: route.id }, scanId ?? undefined);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard niet beschikbaar — stil falen, geen kritieke actie
    }
  }

  return (
    <button type="button" onClick={handleShare} className="btn-outline">
      {copied ? "Gekopieerd!" : "Deel jouw resultaat"}
    </button>
  );
}
