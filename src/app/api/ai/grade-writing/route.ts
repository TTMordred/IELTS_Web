import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeWritingEssay } from "@/lib/ai/gemini";
import { getAIModel, isAIEnabled } from "@/lib/ai/check-ai-enabled";

function friendlyError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err);
  // Gemini API access denied (403)
  if (/403|Forbidden|denied access/i.test(raw)) {
    return {
      message: "AI service unavailable — API key bị từ chối access. Vui lòng liên hệ admin.",
      status: 503,
    };
  }
  // Rate limit / quota
  if (/429|quota|rate limit/i.test(raw)) {
    return { message: "AI đang quá tải, vui lòng thử lại sau vài phút.", status: 429 };
  }
  // Safety block
  if (/safety|blocked|empty response/i.test(raw)) {
    return { message: "AI không thể chấm bài này (có thể bị block bởi safety filter).", status: 422 };
  }
  return { message: raw || "AI grading failed", status: 500 };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin toggle — must be enabled
  const [aiEnabled, model] = await Promise.all([isAIEnabled(), getAIModel()]);
  if (!aiEnabled) {
    return NextResponse.json(
      { error: "AI features are currently disabled by admin.", aiDisabled: true },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { entryId, taskType, subType, questionText, essayContent } = body;

  // Mode 1: direct content (pre-submission grading)
  if (!entryId && taskType && essayContent) {
    try {
      const result = await gradeWritingEssay({
        taskType: taskType as "task1" | "task2",
        subType: subType ?? "",
        questionText: questionText ?? "",
        essayContent,
        model,
      });
      return NextResponse.json({ ...result, model });
    } catch (err) {
      const { message, status } = friendlyError(err);
      console.error("[API grade-writing]", message);
      return NextResponse.json({ error: message }, { status });
    }
  }

  // Mode 2: entryId-based (post-save grading from detail page)
  if (!entryId) {
    return NextResponse.json(
      { error: "Provide either entryId or direct content (taskType + essayContent)" },
      { status: 400 }
    );
  }

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
      model,
    });
    return NextResponse.json({ ...result, model });
  } catch (err) {
    const { message, status } = friendlyError(err);
    console.error("[API grade-writing]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
