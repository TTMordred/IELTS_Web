import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateSpeaking } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await request.json();

  const { data: entry, error } = await supabase
    .from("speaking_entries")
    .select("id, type, reflection")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (error || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const { data: parts } = await supabase
    .from("speaking_parts")
    .select("part, topic, notes")
    .eq("entry_id", entryId)
    .order("part", { ascending: true });

  const combinedNotes = [
    entry.reflection ? `Reflection: ${entry.reflection}` : "",
    ...((parts ?? []) as { part: number; topic?: string; notes?: string }[]).map(
      (p) =>
        `Part ${p.part}${p.topic ? ` — ${p.topic}` : ""}${p.notes ? `\n${p.notes}` : ""}`
    ),
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await evaluateSpeaking({
      part: 1,
      topic: entry.type ?? "speaking",
      notes: combinedNotes || "No notes provided",
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
