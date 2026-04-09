"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";

const EXAMS = [
  { id: "ielts", label: "IELTS", description: "International English Language Testing System" },
  { id: "toefl", label: "TOEFL", description: "Test of English as a Foreign Language" },
  { id: "pte", label: "PTE", description: "Pearson Test of English Academic" },
] as const;

type ExamId = (typeof EXAMS)[number]["id"];

export function ExamProfile() {
  const [selected, setSelected] = useState<ExamId>("ielts");

  useEffect(() => {
    const stored = localStorage.getItem("exam-profile") as ExamId | null;
    if (stored && EXAMS.some((e) => e.id === stored)) setSelected(stored);
  }, []);

  function choose(id: ExamId) {
    setSelected(id);
    localStorage.setItem("exam-profile", id);
  }

  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        <div>
          <h2 className="heading-md">Exam Profile</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">
            Choose your target exam to personalise the hub
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {EXAMS.map((exam) => (
          <button
            key={exam.id}
            onClick={() => choose(exam.id)}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
              selected === exam.id
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-ink)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]/40"
            }`}
          >
            <span className="font-semibold text-base">{exam.label}</span>
            <span className="text-xs text-center leading-tight opacity-70">{exam.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
