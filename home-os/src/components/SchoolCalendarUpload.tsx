"use client";

import { useRef, useState, useTransition } from "react";
import { uploadSchoolCalendarAction } from "@/app/actions";

function guessFileType(file: File): "pdf" | "csv" | "xlsx" | "image" | "unknown" {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (file.type.startsWith("image/")) return "image";
  return "unknown";
}

export default function SchoolCalendarUpload({ schoolYearId }: { schoolYearId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ count: number; notes: string; fileName: string } | null>(null);

  function handleFile(file: File) {
    setResult(null);
    startTransition(async () => {
      const fileType = guessFileType(file);
      const res = await uploadSchoolCalendarAction(schoolYearId, file.name, fileType);
      setResult({ ...res, fileName: file.name });
    });
  }

  return (
    <div className="card p-4 md:p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">Schoolkalender uploaden</h2>
      <p className="mb-3 text-sm text-ink-soft">
        PDF, CSV, Excel of een foto — Home OS haalt er automatisch studiedagen, vakanties en activiteiten uit.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv,.xlsx,.xls,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Bezig met verwerken…" : "📎 Bestand kiezen"}
      </button>
      {result && (
        <div className="mt-3 rounded-xl bg-sage-soft p-3 text-sm text-sage">
          ✓ {result.count} gebeurtenissen gevonden in &ldquo;{result.fileName}&rdquo;. {result.notes}
        </div>
      )}
    </div>
  );
}
