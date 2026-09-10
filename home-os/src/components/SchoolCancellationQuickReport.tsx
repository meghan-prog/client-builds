"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { reportSchoolCancellationAction } from "@/app/actions";

export default function SchoolCancellationQuickReport({
  familyChildren,
}: {
  familyChildren: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [childId, setChildId] = useState<string>("all");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-danger/30 bg-[#FBE7E5] px-4 py-2.5 text-sm font-semibold text-danger hover:opacity-90"
      >
        🚫 School afgelast melden
      </button>
    );
  }

  return (
    <div className="card w-full border-danger/30 p-4 md:max-w-md">
      <h3 className="mb-3 text-sm font-semibold text-ink">🚫 School afgelast melden</h3>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
          Datum
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
          Voor wie?
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="all">Alle kinderen</option>
            {familyChildren.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
          Reden (optioneel)
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijv. 'juf ziek', 'sneeuw'…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const { weekStart } = await reportSchoolCancellationAction(
                  date,
                  childId === "all" ? null : childId,
                  reason
                );
                router.push(`/week/${weekStart}/${date}`);
              });
            }}
            className="flex-1 rounded-full bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Bezig met herplannen…" : "Melden en planning aanpassen"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-muted"
          >
            Annuleren
          </button>
        </div>
        <p className="text-xs text-ink-faint">
          Home OS haalt de schoolroutine dan weg voor deze dag, houdt de leeractiviteit(en) automatisch aan, en
          plant ze desnoods in de vrijgekomen tijd.
        </p>
      </div>
    </div>
  );
}
