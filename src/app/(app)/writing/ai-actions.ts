"use server";

import { createClient } from "@/lib/supabase/server";
import { isAIEnabled } from "@/lib/ai/check-ai-enabled";
import { gradeWritingEssay } from "@/lib/ai/gemini";
import { revalidatePath } from "next/cache";

export async function gradeEssayWithAI(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check AI enabled
  const aiEnabled = await isAIEnabled();
  if (!aiEnabled) throw new Error("AI features are currently disabled by admin");

  // Get the essay
  const { data: entry, error } = await supabase
    .from("writing_entries")
    .select("task_type, sub_type, question_text, essay_content")
    .eq("id", entryId)
    .single();

  if (error || !entry) throw new Error("Entry not found");
  if (!entry.essay_content) throw new Error("No essay content to grade");

  // Call Gemini
  const result = await gradeWritingEssay({
    taskType: entry.task_type as "task1" | "task2",
    subType: entry.sub_type,
    questionText: entry.question_text || "",
    essayContent: entry.essay_content,
  });

  // Update entry with AI scores
  const { error: updateError } = await supabase
    .from("writing_entries")
    .update({
      ta_score: result.ta,
      cc_score: result.cc,
      lr_score: result.lr,
      gra_score: result.gra,
      estimated_band: result.overallBand,
      feedback: `[AI Feedback]\n${result.feedback}\n\n✅ Strengths:\n${result.strengths.map((s) => `• ${s}`).join("\n")}\n\n📈 Areas to improve:\n${result.improvements.map((i) => `• ${i}`).join("\n")}`,
    })
    .eq("id", entryId);

  if (updateError) throw updateError;

  revalidatePath(`/writing/${entryId}`);
  revalidatePath("/writing");

  return result;
}
