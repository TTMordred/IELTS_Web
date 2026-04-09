"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inlineUpdateField(
  table: string,
  id: string,
  field: string,
  value: string | number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Whitelist allowed tables and fields to prevent injection
  const allowedUpdates: Record<string, string[]> = {
    listening_records: ["test_name", "reflection", "total_score", "self_rating", "source"],
    reading_records: ["test_name", "reflection", "total_score", "self_rating", "source"],
    writing_entries: ["topic", "feedback", "essay_content"],
    speaking_entries: ["reflection"],
    vocab_cards: ["word", "meaning", "example", "topic"],
    grammar_notes: ["rule"],
  };

  const allowed = allowedUpdates[table];
  if (!allowed || !allowed.includes(field)) {
    throw new Error(`Field "${field}" on "${table}" is not inline-editable`);
  }

  // Tables with user_id column
  const userIdTables = ["listening_records", "reading_records", "writing_entries", "speaking_entries", "vocab_cards", "grammar_notes"];

  if (userIdTables.includes(table)) {
    const { error } = await supabase
      .from(table)
      .update({ [field]: value })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error("Update failed");
  }

  // Revalidate relevant paths
  const pathMap: Record<string, string> = {
    listening_records: "/listening",
    reading_records: "/reading",
    writing_entries: "/writing",
    speaking_entries: "/speaking",
    vocab_cards: "/vocab",
    grammar_notes: "/grammar",
  };

  revalidatePath(pathMap[table] || "/dashboard");
}
