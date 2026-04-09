"use server";

import { createClient } from "@/lib/supabase/server";
import { isAIEnabled } from "@/lib/ai/check-ai-enabled";
import { evaluateSpeaking } from "@/lib/ai/gemini";

export async function evaluateSpeakingWithAI(input: {
  part: 1 | 2 | 3;
  topic: string;
  notes: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const aiEnabled = await isAIEnabled();
  if (!aiEnabled) throw new Error("AI features are currently disabled by admin");

  if (!input.notes || input.notes.trim().length < 20) {
    throw new Error("Please provide more detailed notes for AI evaluation (min 20 characters)");
  }

  const result = await evaluateSpeaking({
    part: input.part,
    topic: input.topic,
    notes: input.notes,
  });

  return result;
}
