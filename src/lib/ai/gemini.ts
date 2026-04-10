import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TeacherFeedback } from "@/lib/types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_INPUT_LENGTH = 5000;

function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (isNaN(n)) return 5;
  return Math.max(1, Math.min(9, Math.round(n)));
}

function safeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s) => typeof s === "string").slice(0, 10);
}

function parseAIJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Invalid JSON in AI response");
  }
}

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export async function gradeWritingEssay(input: {
  taskType: "task1" | "task2";
  subType: string;
  questionText: string;
  essayContent: string;
  model?: string;
}): Promise<{
  ta: number;
  cc: number;
  lr: number;
  gra: number;
  overallBand: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  teacherFeedback: TeacherFeedback;
}> {
  const model = getClient().getGenerativeModel({ model: input.model ?? DEFAULT_MODEL });

  const taskLabel = input.taskType === "task1" ? "Task 1" : "Task 2";
  const prompt = `You are a senior IELTS examiner and experienced writing coach. Grade this IELTS ${taskLabel} essay and provide detailed teacher-quality feedback in Vietnamese.

Essay type: ${input.subType}
Question: ${input.questionText || "(not provided)"}

Essay:
${input.essayContent}

Score against official IELTS band descriptors. Then write teacher feedback referencing specific parts of the essay — not generic advice.

Return ONLY valid JSON (no markdown, no code blocks, no nested braces inside string values):
{
  "ta": <integer 1-9, Task Achievement>,
  "cc": <integer 1-9, Coherence and Cohesion>,
  "lr": <integer 1-9, Lexical Resource>,
  "gra": <integer 1-9, Grammatical Range and Accuracy>,
  "overallBand": <average of 4 scores rounded to nearest 0.5>,
  "feedback": "<2-3 câu tổng quan bằng tiếng Việt>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "improvements": ["<cần cải thiện 1>", "<cần cải thiện 2>", "<cần cải thiện 3>"],
  "teacherFeedback": {
    "logic": "<2-4 câu phân tích tư duy và lập luận: luận điểm có rõ ràng không, có được phát triển tốt không, ví dụ có thuyết phục không, dẫn chứng có liên quan không>",
    "structure": "<2-4 câu phân tích cấu trúc: intro/body/conclusion có cân đối không, topic sentences có rõ không, các đoạn có liên kết tốt không, cohesive devices dùng có hiệu quả không>",
    "grammar": "<2-4 câu phân tích ngữ pháp: nêu cụ thể 1-2 lỗi sai điển hình từ bài, loại lỗi hay gặp, mức độ ảnh hưởng đến band score>",
    "vocab": "<2-4 câu phân tích từ vựng: range có phong phú không, có dùng từ chính xác không, có bị lặp từ không, gợi ý 1-2 từ/cụm từ tốt hơn cụ thể>",
    "enhancement": "<2-4 câu gợi ý cải thiện cụ thể và có thể thực hiện ngay để tăng band score>"
  }
}

Score fairly — most IELTS students are band 5.0-7.0. Do not inflate scores.`;

  if (input.essayContent.length > MAX_INPUT_LENGTH) {
    throw new Error("Essay too long for AI grading (max 5000 chars)");
  }

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseAIJson(text);

  const rawTF = (raw.teacherFeedback ?? {}) as Record<string, unknown>;
  return {
    ta: clampScore(raw.ta),
    cc: clampScore(raw.cc),
    lr: clampScore(raw.lr),
    gra: clampScore(raw.gra),
    overallBand: Math.round((clampScore(raw.ta) + clampScore(raw.cc) + clampScore(raw.lr) + clampScore(raw.gra)) / 4 * 2) / 2,
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    strengths: safeStringArray(raw.strengths),
    improvements: safeStringArray(raw.improvements),
    teacherFeedback: {
      logic: typeof rawTF.logic === "string" ? rawTF.logic : "",
      structure: typeof rawTF.structure === "string" ? rawTF.structure : "",
      grammar: typeof rawTF.grammar === "string" ? rawTF.grammar : "",
      vocab: typeof rawTF.vocab === "string" ? rawTF.vocab : "",
      enhancement: typeof rawTF.enhancement === "string" ? rawTF.enhancement : "",
    },
  };
}

export async function evaluateSpeaking(input: {
  part: 1 | 2 | 3;
  topic: string;
  notes: string;
  model?: string;
}): Promise<{
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  overallBand: number;
  feedback: string;
  tips: string[];
}> {
  const model = getClient().getGenerativeModel({ model: input.model ?? DEFAULT_MODEL });

  const prompt = `You are a senior IELTS Speaking examiner. Evaluate this Speaking Part ${input.part} response.

Topic: ${input.topic}
Student's response/notes:
${input.notes}

Based on the content quality, vocabulary used, and grammar patterns visible, estimate scores.
Return ONLY valid JSON (no markdown):
{
  "fluency": <1-9 Fluency & Coherence>,
  "lexical": <1-9 Lexical Resource>,
  "grammar": <1-9 Grammatical Range & Accuracy>,
  "pronunciation": <1-9 estimated Pronunciation>,
  "overallBand": <average rounded to nearest 0.5>,
  "feedback": "<2-3 sentence assessment in Vietnamese>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}

Note: You're evaluating written notes, not actual speech. Estimate pronunciation based on vocabulary sophistication. Be constructive.`;

  if (input.notes.length > MAX_INPUT_LENGTH) {
    throw new Error("Notes too long for AI evaluation (max 5000 chars)");
  }

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseAIJson(text);

  return {
    fluency: clampScore(raw.fluency),
    lexical: clampScore(raw.lexical),
    grammar: clampScore(raw.grammar),
    pronunciation: clampScore(raw.pronunciation),
    overallBand: Math.round((clampScore(raw.fluency) + clampScore(raw.lexical) + clampScore(raw.grammar) + clampScore(raw.pronunciation)) / 4 * 2) / 2,
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    tips: safeStringArray(raw.tips),
  };
}

export async function analyzeErrors(input: {
  skill: "listening" | "reading";
  mistakes: { questionType: string; mistakesNote: string }[];
}): Promise<{
  patterns: { pattern: string; frequency: number; description: string }[];
  advice: string;
}> {
  const model = getClient().getGenerativeModel({ model: DEFAULT_MODEL });

  const prompt = `Analyze these IELTS ${input.skill} mistake patterns:

${input.mistakes.map((m) => `- ${m.questionType}: ${m.mistakesNote}`).join("\n")}

Identify recurring error patterns. Return ONLY valid JSON:
{
  "patterns": [
    {"pattern": "<pattern name>", "frequency": <percentage 0-100>, "description": "<explanation in Vietnamese>"}
  ],
  "advice": "<overall advice in Vietnamese, 2-3 sentences>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseAIJson(text);

  return {
    patterns: Array.isArray(raw.patterns)
      ? raw.patterns.map((p: Record<string, unknown>) => ({
          pattern: typeof p.pattern === "string" ? p.pattern : "",
          frequency: typeof p.frequency === "number" ? Math.min(100, Math.max(0, p.frequency)) : 0,
          description: typeof p.description === "string" ? p.description : "",
        })).slice(0, 10)
      : [],
    advice: typeof raw.advice === "string" ? raw.advice : "",
  };
}
