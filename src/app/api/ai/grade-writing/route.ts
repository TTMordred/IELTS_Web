import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeWritingEssay } from "@/lib/ai/gemini";

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
    .from("writing_entries")
    .select("id, task_type, sub_type, question_text, essay_content")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (error || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  try {
    const result = await gradeWritingEssay({
      taskType: entry.task_type as "task1" | "task2",
      subType: entry.sub_type ?? "",
      questionText: entry.question_text ?? "",
      essayContent: entry.essay_content ?? "",
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI grading failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
