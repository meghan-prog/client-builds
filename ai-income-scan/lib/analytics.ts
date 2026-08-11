export type AnalyticsEvent =
  | "landing_view"
  | "scan_started"
  | "question_answered"
  | "scan_completed"
  | "result_viewed"
  | "lead_submitted"
  | "academy_cta_clicked"
  | "result_shared";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Client-side event tracker. Stuurt naar onze eigen /api/event (voor de
 * admin-analytics) en, indien geconfigureerd, door naar GA4 / Meta Pixel.
 * Faalt altijd stil — analytics mag de UX nooit blokkeren.
 */
export function trackEvent(
  event: AnalyticsEvent,
  payload: Record<string, unknown> = {},
  scanId?: string
): void {
  if (typeof window === "undefined") return;

  try {
    if (window.gtag) {
      window.gtag("event", event, payload);
    }
    if (window.fbq) {
      window.fbq("trackCustom", event, payload);
    }
  } catch {
    // analytics mag de app nooit breken
  }

  try {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, scanId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // fire-and-forget
  }
}
