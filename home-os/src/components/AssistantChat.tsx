"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  applyAgentActionAction,
  dismissAgentActionAction,
  sendAgentMessageAction,
} from "@/app/actions";
import type { SuggestedActivity } from "@/lib/ai/activity-suggester";

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  actionType: string | null;
  actionPayload: string | null;
  actionStatus: string | null;
  createdAt: string;
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => (
    <p key={i} className={line.trim() === "" ? "h-2" : ""}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </p>
  ));
}

const ACTION_LABELS: Record<string, { execute: string; dismiss: string }> = {
  cancel_school: { execute: "✅ Doorvoeren", dismiss: "Negeren" },
  create_learning_focus: { execute: "✅ Toevoegen aan planning", dismiss: "Negeren" },
};

function ActionCard({ message }: { message: ChatMessage }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!message.actionType || message.actionType === "clarify_child") return null;
  const labels = ACTION_LABELS[message.actionType];
  if (!labels) return null;

  const payload = message.actionPayload ? JSON.parse(message.actionPayload) : null;
  const activities: SuggestedActivity[] | null =
    message.actionType === "create_learning_focus" ? payload?.activities ?? null : null;

  if (message.actionStatus === "applied") {
    return <p className="mt-2 text-xs font-medium text-sage">✓ Toegevoegd aan de planning</p>;
  }
  if (message.actionStatus === "dismissed") {
    return <p className="mt-2 text-xs text-ink-faint">Genegeerd</p>;
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-3">
      {activities && (
        <div className="mb-3 flex flex-col gap-1.5">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs text-ink">
              <span>{a.icon}</span>
              <span className="font-medium">{a.title}</span>
              <span className="text-ink-faint">· {a.durationMinutes} min</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await applyAgentActionAction(message.id);
              router.refresh();
            })
          }
          className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {labels.execute}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await dismissAgentActionAction(message.id);
              router.refresh();
            })
          }
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface-muted disabled:opacity-60"
        >
          {labels.dismiss}
        </button>
      </div>
    </div>
  );
}

export default function AssistantChat({ messages }: { messages: ChatMessage[] }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const value = text.trim();
    if (!value || isPending) return;
    setText("");
    startTransition(async () => {
      await sendAgentMessageAction(value);
      router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col md:h-screen">
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="card p-5 text-sm text-ink-soft">
              👋 Hoi! Vertel me gerust dingen als &ldquo;school is morgen afgelast&rdquo;, &ldquo;focus deze week op
              tandenpoetsen&rdquo;, of vraag me om leuke activiteiten te bedenken.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user" ? "bg-accent text-white" : "card text-ink"
                }`}
              >
                <div className="space-y-1">{renderContent(m.content)}</div>
                {m.role === "assistant" && <ActionCard message={m} />}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex justify-start">
              <div className="card px-4 py-3 text-sm text-ink-faint">Even denken…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-surface px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Typ een bericht…"
            className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={isPending || !text.trim()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Stuur
          </button>
        </div>
      </div>
    </div>
  );
}
