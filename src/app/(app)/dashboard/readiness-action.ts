"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateReadinessScore } from "@/lib/readiness-score";
import { getAuthUser } from "@/lib/supabase/cached-auth";

export async function getReadinessData() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;

  // Fetch all type results for this user
  const [listeningResults, readingResults] = await Promise.all([
    supabase
      .from("listening_type_results")
      .select(`
        question_type, correct, total,
        listening_section_details!inner(
          record_id,
          listening_records!inner(user_id)
        )
      `)
      .eq("listening_section_details.listening_records.user_id", user.id),
    supabase
      .from("reading_type_results")
      .select(`
        question_type, correct, total,
        reading_passage_details!inner(
          record_id,
          reading_records!inner(user_id)
        )
      `)
      .eq("reading_passage_details.reading_records.user_id", user.id),
  ]);

  // Aggregate per type
  const typeMap = new Map<string, { correct: number; total: number; attempts: number; frequency: "high" | "medium" | "low" }>();

  const processResults = (results: { question_type: string; correct: number; total: number }[]) => {
    for (const r of results) {
      const existing = typeMap.get(r.question_type) || { correct: 0, total: 0, attempts: 0, frequency: "medium" as const };
      existing.correct += r.correct;
      existing.total += r.total;
      existing.attempts += 1;
      typeMap.set(r.question_type, existing);
    }
  };

  processResults(listeningResults.data || []);
  processResults(readingResults.data || []);

  const typeAccuracies = Array.from(typeMap.entries()).map(([questionType, data]) => ({
    questionType,
    accuracy: data.total > 0 ? data.correct / data.total : 0,
    attempts: data.attempts,
    frequency: data.frequency,
  }));

  // Get current band from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_est_band")
    .eq("id", user.id)
    .single();

  return calculateReadinessScore(typeAccuracies, profile?.current_est_band || 0);
}
