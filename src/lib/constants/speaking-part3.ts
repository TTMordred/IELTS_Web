import type { Part3AnswerFunction } from "@/lib/types";

/**
 * Speaking Part 3 — controlled Answer Function enum. Unlike Part 1's free-text
 * `answer_function` (validated against its own templates), Part 3 has its own
 * closed set so the reasoning framework can be seeded per function. New
 * functions are added by appending to this list + DEFAULT_ANSWER_STRUCTURE.
 */
export const PART3_ANSWER_FUNCTIONS: Part3AnswerFunction[] = [
  "Opinion",
  "Cause / Reason",
  "Effect / Impact",
  "Advantages",
  "Disadvantages",
  "Compare / Contrast",
  "Agree / Disagree",
  "Problem",
  "Solution",
  "Prediction / Future",
  "Evaluation / A vs B",
];

/** Short hint shown under the Answer Function selector. */
export const PART3_ANSWER_FUNCTION_LABELS: Record<Part3AnswerFunction, string> = {
  "Opinion": "Give a personal viewpoint",
  "Cause / Reason": "Explain why something happens",
  "Effect / Impact": "Describe consequences or influence",
  "Advantages": "List and explain the benefits",
  "Disadvantages": "List and explain the drawbacks",
  "Compare / Contrast": "Weigh two things against each other",
  "Agree / Disagree": "Take a clear stance with reasons",
  "Problem": "Identify and explain a difficulty",
  "Solution": "Propose and justify a fix",
  "Prediction / Future": "Forecast a trend or outcome",
  "Evaluation / A vs B": "Judge options against criteria",
};

/**
 * Default per-function reasoning framework. These are only a starting point:
 * the stored `answer_structure` on each question is editable and is the source
 * of truth, mirroring Part 2's editable cue-card structure.
 */
export const DEFAULT_ANSWER_STRUCTURE: Record<Part3AnswerFunction, string[]> = {
  "Opinion": ["Opinion", "Reason", "Explanation", "Example", "Qualification"],
  "Cause / Reason": ["Cause", "Explanation", "Example", "Result"],
  "Effect / Impact": ["Impact", "Mechanism", "Example", "Implication"],
  "Advantages": ["Advantage 1", "Explanation", "Example", "Advantage 2 or nuance"],
  "Disadvantages": ["Disadvantage 1", "Explanation", "Example", "Mitigation or nuance"],
  "Compare / Contrast": ["Point of comparison", "A vs B", "Similarity or difference", "Result"],
  "Agree / Disagree": ["Stance", "Main reason", "Explanation", "Example", "Concession"],
  "Problem": ["Problem", "Why it matters", "Example", "Consequences"],
  "Solution": ["Solution", "How it works", "Example", "Feasibility or result"],
  "Prediction / Future": ["Prediction", "Basis", "Conditions", "Implication"],
  "Evaluation / A vs B": ["Criterion", "A evaluation", "B evaluation", "Verdict"],
};
