"use client";

import { Question } from "@/config/questions";

interface Props {
  question: Question;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}

export function QuestionCard({ question, selectedOptionId, onSelect }: Props) {
  return (
    <div key={question.id} className="fade-in">
      <h2 className="text-2xl md:text-3xl text-mahogany mb-7">{question.text}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`answer-card ${selectedOptionId === option.id ? "selected" : ""}`}
            aria-pressed={selectedOptionId === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
