import { ALL_QUESTION_TYPES } from "@/lib/constants/listening-types";
import { READING_QUESTION_TYPES } from "@/lib/constants/reading-types";
import { BookOpen, Headphones } from "lucide-react";
import { getQuestionTypeNotes } from "./actions";
import { QuestionTypeCard } from "@/components/wiki/question-type-card";

const LISTENING_SECTIONS = [
  { section: 1, title: "Everyday Conversation" },
  { section: 2, title: "Everyday Monologue" },
  { section: 3, title: "Academic Conversation" },
  { section: 4, title: "Academic Lecture" },
];

const READING_GROUPS = ["Identifying Information", "Matching", "Completion", "Selection"];

export default async function WikiPage() {
  const [listeningNotes, readingNotes] = await Promise.all([
    getQuestionTypeNotes("listening"),
    getQuestionTypeNotes("reading"),
  ]);

  const listeningTypes = ALL_QUESTION_TYPES;
  const readingTypes = READING_QUESTION_TYPES;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
          Question Type Wiki
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Reference for all 41 tracked question types — strategies, traps, and frequency
        </p>
      </div>

      {/* Listening Types */}
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <Headphones className="w-5 h-5 text-[#378ADD]" />
          Listening — 27 Question Types
        </h2>

        {LISTENING_SECTIONS.map((sec) => {
          const sectionTypes = listeningTypes.filter((t) => t.section === sec.section);
          return (
            <div key={sec.section} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-[#378ADD] mb-2">
                Section {sec.section} — {sec.title}
              </h3>
              <div className="space-y-2">
                {sectionTypes.map((type) => (
                  <QuestionTypeCard
                    key={type.id}
                    module="listening"
                    typeId={type.id}
                    typeName={type.name}
                    description={type.description}
                    frequency={type.frequency}
                    accentColor="#378ADD"
                    initialNote={listeningNotes[type.id] ?? null}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reading Types */}
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-[#D85A30]" />
          Reading — 14 Question Types
        </h2>

        {READING_GROUPS.map((group) => {
          const groupTypes = readingTypes.filter((t) => t.group === group);
          return (
            <div key={group} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-[#D85A30] mb-2">{group}</h3>
              <div className="space-y-2">
                {groupTypes.map((type) => (
                  <QuestionTypeCard
                    key={type.id}
                    module="reading"
                    typeId={type.id}
                    typeName={type.name}
                    description={type.description}
                    frequency={type.frequency}
                    accentColor="#D85A30"
                    initialNote={readingNotes[type.id] ?? null}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">41</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Total Types</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[#378ADD]">27</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Listening</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[#D85A30]">14</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Reading</p>
        </div>
      </div>
    </div>
  );
}
