export const ANSWER_FUNCTION_TEMPLATES = [
  { function: "Agree", structure: "Opinion → Identity reason → Explanation → Result" },
  { function: "Benefit", structure: "Main benefit → Explanation → Personal example" },
  { function: "Cause / Effect", structure: "Cause → Effect → Example" },
  { function: "Comparison", structure: "A vs B → Preference → Reason" },
  { function: "Disagree", structure: "Polite disagreement → Reason → Example" },
  { function: "Future Plan", structure: "Wish → Reason → Possible result" },
  { function: "Habit", structure: "Frequency → Activity → Reason → Limit" },
  { function: "Partial Agreement", structure: "Partly agree → One side → Other side → Final view" },
  { function: "Past Experience", structure: "Time → Situation → Action → Feeling" },
  { function: "Preference", structure: "Direct answer → Reason → Example → Feeling" },
  { function: "Problem", structure: "Problem → Why it matters → Example" },
  { function: "Uncertainty", structure: "Soft start → Think → Answer" },
] as const;

export type AnswerFunction = (typeof ANSWER_FUNCTION_TEMPLATES)[number]["function"];

export function answerStructureFor(answerFunction: string): string | null {
  return ANSWER_FUNCTION_TEMPLATES.find((item) => item.function === answerFunction)?.structure ?? null;
}
