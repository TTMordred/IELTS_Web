import { getMistakes } from "./actions";
import { MistakeBoard } from "@/components/mistakes/mistake-board";
import { AlertTriangle } from "lucide-react";

export default async function MistakesPage() {
  const mistakes = await getMistakes();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-[var(--color-accent)]" />
          Mistake Journal
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Track errors, understand why they happen, and review with spaced repetition. {mistakes.length} entries.
        </p>
      </div>
      <MistakeBoard initialMistakes={mistakes} />
    </div>
  );
}
