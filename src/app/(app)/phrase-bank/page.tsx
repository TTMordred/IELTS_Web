import { BookOpenText } from "lucide-react";
import { getLanguageNotes } from "./actions";
import { PhraseBankBoard } from "@/components/phrase-bank/phrase-bank-board";

export default async function PhraseBankPage() {
  const notes = await getLanguageNotes();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BookOpenText className="h-6 w-6 text-[var(--color-accent)]" />
          Phrase Bank
        </h1>
        <p className="mt-1 text-[var(--color-ink-secondary)]">
          Review idioms, collocations, and linking words from your IELTS practice.
        </p>
      </div>
      <PhraseBankBoard initialNotes={notes} />
    </div>
  );
}
