"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  connectCalendarFeedAction,
  disconnectCalendarFeedAction,
  syncCalendarFeedAction,
} from "@/app/actions";

export default function CalendarFeedConnect({
  icsFeedUrl,
  lastSyncedAt,
}: {
  icsFeedUrl: string | null;
  lastSyncedAt: string | null;
}) {
  const [url, setUrl] = useState(icsFeedUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  return (
    <section className="mb-8 card p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">Agenda koppelen</h2>
      <p className="mb-3 text-sm text-ink-soft">
        Koppel jullie Google-, Apple- of Outlook-agenda via het &ldquo;geheime adres in iCal-indeling&rdquo; —
        Home OS haalt afspraken automatisch op en houdt ze bij (herhalende afspraken inbegrepen).
      </p>

      {icsFeedUrl ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-sage-soft px-3 py-2 text-sm text-sage">
          <span>✓</span>
          <span className="min-w-0 flex-1 truncate">Gekoppeld: {icsFeedUrl}</span>
        </div>
      ) : (
        <p className="mb-3 text-xs text-ink-faint">Nog geen agenda gekoppeld.</p>
      )}

      {lastSyncedAt && (
        <p className="mb-3 text-xs text-ink-faint">
          Laatst gesynchroniseerd: {new Date(lastSyncedAt).toLocaleString("nl-NL")}
        </p>
      )}

      {!icsFeedUrl && (
        <div className="mb-3 flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <p className="text-xs text-ink-faint">
            Google: Agenda-instellingen → jullie agenda → &ldquo;Geheime adres in iCal-indeling&rdquo;. Apple/
            iCloud: Agenda-app → agenda delen → openbare agenda. Outlook: agenda-instellingen → publiceren.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!icsFeedUrl ? (
          <button
            type="button"
            disabled={isPending || !url.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await connectCalendarFeedAction(url.trim());
                setResult(`✓ ${res.importedCount} afspraken opgehaald.`);
                router.refresh();
              })
            }
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Bezig met koppelen…" : "Koppelen"}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await syncCalendarFeedAction();
                  setResult(`✓ ${res.importedCount} afspraken bijgewerkt.`);
                  router.refresh();
                })
              }
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Bezig…" : "Nu synchroniseren"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await disconnectCalendarFeedAction();
                  setResult(null);
                  router.refresh();
                })
              }
              className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-muted disabled:opacity-60"
            >
              Loskoppelen
            </button>
          </>
        )}
      </div>

      {result && <p className="mt-3 text-sm text-sage">{result}</p>}
    </section>
  );
}
