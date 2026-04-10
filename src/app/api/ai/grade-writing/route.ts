import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeWritingEssay } from "@/lib/ai/gemini";
import { getAIModel } from "@/lib/ai/check-ai-enabled";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { entryId, taskType, subType, questionText, essayContent } = body;

  // Mode 1: direct content (pre-submission grading)
  if (!entryId && taskType && essayContent) {
    const model = await getAIModel();
    try {
      const result = await gradeWritingEssay({
        taskType: taskType as "task1" | "task2",
        subType: subType ?? "",
        questionText: questionText ?? "",
        essayContent,
        model,
      });
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI grading failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Mode 2: entryId-based (post-save grading from detail page)
  if (!entryId) {
    return NextResponse.json(
      { error: "Provide either entryId or direct content (taskType + essayContent)" },
      { status: 400 }
    );
  }

  const [{ data: entry, error }, model] = await Promise.all([
    supabase
      .from("writing_entries")
      .select("id, task_type, sub_type, question_text, essay_content")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single(),
    getAIModel(),
  ]);

  if (error || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  try {
    const result = await gradeWritingEssay({
      taskType: entry.task_type as "task1" | "task2",
      subType: entry.sub_type ?? "",
      questionText: entry.question_text ?? "",
      essayContent: entry.essay_content ?? "",
      model,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI grading failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
