import { getGrammarNotes } from "./actions";
import { GrammarBoard } from "@/components/grammar/grammar-board";
import { BookOpen } from "lucide-react";

export default async function GrammarPage() {
  const notes = await getGrammarNotes();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
          Grammar Notes
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          {notes.length} notes across 14 grammar categories
        </p>
      </div>
      <GrammarBoard initialNotes={notes} />
    </div>
  );
}
