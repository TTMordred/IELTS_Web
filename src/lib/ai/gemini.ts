import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  RichTeacherFeedback,
  CriterionFeedback,
  VocabUpgrade,
  GrammarItem,
  ParagraphAnalysis,
  ModelOutlineItem,
  EssayMeta,
} from "@/lib/types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_INPUT_LENGTH = 5000;

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
  // Strip markdown code fences if present
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // Try direct parse first (works when responseMimeType is set)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: extract outermost JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response — no JSON object found");
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Last resort: try fixing common issues (trailing commas)
      const fixed = jsonMatch[0]
        .replace(/,\s*([}\]])/g, "$1")  // remove trailing commas
        .replace(/[\x00-\x1f]/g, (c) => c === "\n" || c === "\r" || c === "\t" ? c : ""); // remove control chars
      try {
        return JSON.parse(fixed);
      } catch {
        throw new Error("Invalid JSON in AI response");
      }
    }
  }
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function safeNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? fallback : n;
}

function safeBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function parseEssayMeta(raw: unknown): EssayMeta {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    wordCount: safeNumber(r.wordCount, 0),
    sentenceCount: safeNumber(r.sentenceCount, 0),
    paragraphCount: safeNumber(r.paragraphCount, 0),
    avgWordsPerSentence: safeNumber(r.avgWordsPerSentence, 0),
    meetsWordRequirement: safeBool(r.meetsWordRequirement, false),
  };
}

function parseEvidenceArray(v: unknown): Array<{ text: string; evidence?: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      text: safeString(item.text),
      ...(typeof item.evidence === "string" ? { evidence: item.evidence } : {}),
    }))
    .slice(0, 10);
}

function parseTipArray(v: unknown): Array<{ text: string; example?: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      text: safeString(item.text),
      ...(typeof item.example === "string" ? { example: item.example } : {}),
    }))
    .slice(0, 10);
}

function parseCriteria(v: unknown): CriterionFeedback[] {
  if (!Array.isArray(v)) return [];
  const validIds = new Set(["ta", "cc", "lr", "gra"]);
  return v
    .filter((item) => item && typeof item === "object")
    .filter((item: Record<string, unknown>) => validIds.has(safeString(item.id)))
    .map((item: Record<string, unknown>) => ({
      id: safeString(item.id) as CriterionFeedback["id"],
      name: safeString(item.name),
      band: clampScore(item.band),
      verdict: safeString(item.verdict),
      strengths: parseEvidenceArray(item.strengths),
      weaknesses: parseEvidenceArray(item.weaknesses),
      tips: parseTipArray(item.tips),
    }));
}

function parseVocabUpgrades(v: unknown): VocabUpgrade[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      original: safeString(item.original),
      frequency: safeNumber(item.frequency, 1),
      upgrades: safeStringArray(item.upgrades),
      context: safeString(item.context),
    }))
    .slice(0, 10);
}

function parseGrammarLog(v: unknown): GrammarItem[] {
  if (!Array.isArray(v)) return [];
  const validTypes = new Set(["error", "enhancement"]);
  return v
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      type: (validTypes.has(safeString(item.type)) ? safeString(item.type) : "error") as GrammarItem["type"],
      original: safeString(item.original),
      corrected: safeString(item.corrected),
      rule: safeString(item.rule),
    }))
    .slice(0, 10);
}

function parseParagraphAnalysis(v: unknown): ParagraphAnalysis[] {
  if (!Array.isArray(v)) return [];
  const validFunctions = new Set(["introduction", "body", "conclusion"]);
  const validStatuses = new Set(["good", "weak", "missing"]);
  return v
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      index: safeNumber(item.index, 0),
      function: (validFunctions.has(safeString(item.function)) ? safeString(item.function) : "body") as ParagraphAnalysis["function"],
      status: (validStatuses.has(safeString(item.status)) ? safeString(item.status) : "weak") as ParagraphAnalysis["status"],
      note: safeString(item.note),
    }))
    .slice(0, 20);
}

function parseModelOutline(v: unknown): ModelOutlineItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      paragraph: safeNumber(item.paragraph, 0),
      goal: safeString(item.goal),
      sentences: safeNumber(item.sentences, 0),
      content: safeString(item.content),
    }))
    .slice(0, 10);
}

function parseRichFeedback(
  raw: Record<string, unknown>,
  taskType: "task1" | "task2",
): RichTeacherFeedback {
  const rawTF = (raw.teacherFeedback && typeof raw.teacherFeedback === "object"
    ? raw.teacherFeedback
    : {}) as Record<string, unknown>;

  return {
    version: 2,
    taskType: safeString(rawTF.taskType, taskType) === "task1" ? "task1" : "task2",
    essayMeta: parseEssayMeta(rawTF.essayMeta),
    criteria: parseCriteria(rawTF.criteria),
    vocabUpgrades: parseVocabUpgrades(rawTF.vocabUpgrades),
    grammarLog: parseGrammarLog(rawTF.grammarLog),
    paragraphAnalysis: parseParagraphAnalysis(rawTF.paragraphAnalysis),
    modelOutline: parseModelOutline(rawTF.modelOutline),
    teacherComment: safeString(rawTF.teacherComment),
  };
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
  teacherFeedback: RichTeacherFeedback;
}> {
  const essayText = stripHtml(input.essayContent);

  if (essayText.length > MAX_INPUT_LENGTH) {
    throw new Error("Essay too long for AI grading (max 5000 chars)");
  }

  const model = getClient().getGenerativeModel({
    model: input.model ?? DEFAULT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const taskLabel = input.taskType === "task1" ? "Task 1" : "Task 2";
  const criterion1Name = input.taskType === "task1" ? "Task Achievement" : "Task Response";
  const criterion1Desc = input.taskType === "task1"
    ? "covers key features, overview, data accuracy"
    : "covers addressing all parts, position clarity, idea development";

  const prompt = `You are a certified senior IELTS Writing examiner with 15+ years experience. Grade this IELTS ${taskLabel} essay with evidence-based feedback.

Essay type: ${input.subType}
Question: ${input.questionText || "(not provided)"}

Essay:
${essayText}

Score against official IELTS band descriptors (Band 7 reference):
- ${criterion1Name} (ta): "${criterion1Desc}"
- Coherence and Cohesion (cc): "uses a range of cohesive devices appropriately"
- Lexical Resource (lr): "uses less common lexical items with some awareness of style and collocation"
- Grammatical Range and Accuracy (gra): "uses a variety of complex structures; frequent error-free sentences"

Score fairly — most IELTS students score band 5.0-7.0. Do not inflate.

Return JSON with this exact structure:
- ta, cc, lr, gra: integer scores 1-9
- overallBand: average rounded to nearest 0.5
- feedback: 2-3 sentence summary in Vietnamese
- strengths: array of 2-3 strings in Vietnamese
- improvements: array of 2-3 strings in Vietnamese
- teacherFeedback: object with version=2, taskType="${input.taskType}", and:
  - essayMeta: {wordCount, sentenceCount, paragraphCount, avgWordsPerSentence, meetsWordRequirement}
  - criteria: array of 4 objects (id: ta/cc/lr/gra) each with name, band, verdict (English), strengths [{text, evidence}], weaknesses [{text, evidence}], tips [{text, example}]
  - vocabUpgrades: [{original, frequency, upgrades[], context}] — 3-5 repeated/informal words
  - grammarLog: [{type: "error"|"enhancement", original, corrected, rule}] — 2-3 items
  - paragraphAnalysis: [{index, function: "introduction"|"body"|"conclusion", status: "good"|"weak"|"missing", note}]
  - modelOutline: [{paragraph, goal, sentences, content}] — 4-5 steps for Band 8+
  - teacherComment: 3 paragraphs in Vietnamese (strengths, priorities, motivation)`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("AI returned empty response — model may have blocked the content");
  }

  const raw = parseAIJson(text);

  const ta = clampScore(raw.ta);
  const cc = clampScore(raw.cc);
  const lr = clampScore(raw.lr);
  const gra = clampScore(raw.gra);

  return {
    ta,
    cc,
    lr,
    gra,
    overallBand: Math.round((ta + cc + lr + gra) / 4 * 2) / 2,
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    strengths: safeStringArray(raw.strengths),
    improvements: safeStringArray(raw.improvements),
    teacherFeedback: parseRichFeedback(raw, input.taskType),
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
