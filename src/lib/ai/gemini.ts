import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Gemini Flash for cost efficiency (~$0.075/1M tokens vs $1.25 for Pro)
const FLASH_MODEL = "gemini-2.0-flash";
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
}): Promise<{
  ta: number;
  cc: number;
  lr: number;
  gra: number;
  overallBand: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}> {
  const model = getClient().getGenerativeModel({ model: FLASH_MODEL });

  const prompt = `You are a senior IELTS examiner. Grade this IELTS ${input.taskType === "task1" ? "Task 1" : "Task 2"} essay.

Type: ${input.subType}
Question: ${input.questionText}

Essay:
${input.essayContent}

Evaluate against official IELTS band descriptors and return ONLY valid JSON (no markdown):
{
  "ta": <1-9 Task Achievement score>,
  "cc": <1-9 Coherence & Cohesion score>,
  "lr": <1-9 Lexical Resource score>,
  "gra": <1-9 Grammatical Range & Accuracy score>,
  "overallBand": <average of 4 scores rounded to nearest 0.5>,
  "feedback": "<2-3 sentence overall assessment in Vietnamese>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>", "<area to improve 3>"]
}

Be accurate and constructive. Score fairly — most students are band 5.0-7.0.`;

  if (input.essayContent.length > MAX_INPUT_LENGTH) {
    throw new Error("Essay too long for AI grading (max 5000 chars)");
  }

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = parseAIJson(text);

  return {
    ta: clampScore(raw.ta),
    cc: clampScore(raw.cc),
    lr: clampScore(raw.lr),
    gra: clampScore(raw.gra),
    overallBand: Math.round((clampScore(raw.ta) + clampScore(raw.cc) + clampScore(raw.lr) + clampScore(raw.gra)) / 4 * 2) / 2,
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    strengths: safeStringArray(raw.strengths),
    improvements: safeStringArray(raw.improvements),
  };
}

export async function evaluateSpeaking(input: {
  part: 1 | 2 | 3;
  topic: string;
  notes: string;
}): Promise<{
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  overallBand: number;
  feedback: string;
  tips: string[];
}> {
  const model = getClient().getGenerativeModel({ model: FLASH_MODEL });

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
  const model = getClient().getGenerativeModel({ model: FLASH_MODEL });

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
