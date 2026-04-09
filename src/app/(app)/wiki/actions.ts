"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type QtNote = { strategy: string | null; traps: string | null };

export async function getQuestionTypeNotes(
  module: "listening" | "reading",
): Promise<Record<string, QtNote>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from("question_type_notes")
    .select("question_type, strategy, traps")
    .eq("user_id", user.id)
    .eq("module", module);

  if (error || !data) return {};

  return Object.fromEntries(
    data.map((row) => [
      row.question_type,
      { strategy: row.strategy ?? null, traps: row.traps ?? null },
    ]),
  );
}

export async function upsertQuestionTypeNote(input: {
  module: "listening" | "reading";
  question_type: string;
  strategy?: string | null;
  traps?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("question_type_notes")
    .upsert(
      {
        user_id: user.id,
        module: input.module,
        question_type: input.question_type,
        strategy: input.strategy ?? null,
        traps: input.traps ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module,question_type" },
    );

  if (error) throw error;

  revalidatePath("/wiki");
}
