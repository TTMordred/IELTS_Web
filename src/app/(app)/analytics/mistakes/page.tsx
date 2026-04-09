import { createClient } from "@/lib/supabase/server";
import { MistakePatterns } from "@/components/analytics/mistake-patterns";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

async function getMistakeData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { listening: [], reading: [] };

  const [listeningResults, readingResults] = await Promise.all([
    supabase
      .from("listening_type_results")
      .select(`
        question_type, correct, total, mistakes_note,
        listening_section_details!inner(
          record_id,
          listening_records!inner(user_id)
        )
      `)
      .eq("listening_section_details.listening_records.user_id", user.id)
      .not("mistakes_note", "is", null),
    supabase
      .from("reading_type_results")
      .select(`
        question_type, correct, total, mistakes_note,
        reading_passage_details!inner(
          record_id,
          reading_records!inner(user_id)
        )
      `)
      .eq("reading_passage_details.reading_records.user_id", user.id)
      .not("mistakes_note", "is", null),
  ]);

  return {
    listening: (listeningResults.data || []).filter((r) => r.mistakes_note),
    reading: (readingResults.data || []).filter((r) => r.mistakes_note),
  };
}

export default async function MistakePatternsPage() {
  const data = await getMistakeData();
  const totalMistakes = data.listening.length + data.reading.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <Link href="/analytics" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-2 inline-block cursor-pointer">
          &larr; Analytics
        </Link>
        <h1 className="heading-lg flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Mistake Patterns
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Analyze your error patterns across {totalMistakes} logged mistakes
        </p>
      </div>

      <MistakePatterns
        listeningMistakes={data.listening.map((r) => ({
          questionType: r.question_type,
          mistakesNote: r.mistakes_note!,
          correct: r.correct,
          total: r.total,
        }))}
        readingMistakes={data.reading.map((r) => ({
          questionType: r.question_type,
          mistakesNote: r.mistakes_note!,
          correct: r.correct,
          total: r.total,
        }))}
      />
    </div>
  );
}
