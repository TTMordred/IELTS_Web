export const WRITING_TASK1_TYPES = [
  { id: "w1_line_graph", name: "Line Graph", description: "Trends over time — increase, decrease, fluctuate" },
  { id: "w1_bar_chart", name: "Bar Chart", description: "Compare categories — single, grouped, stacked" },
  { id: "w1_pie_chart", name: "Pie Chart", description: "Proportions/percentages — 1-2 pies" },
  { id: "w1_table", name: "Table", description: "Data in rows/columns — select key data" },
  { id: "w1_mixed", name: "Mixed / Combination", description: "2 chart types combined (bar + line, pie + table)" },
  { id: "w1_process", name: "Process Diagram", description: "Natural/man-made process — passive voice, sequencing" },
  { id: "w1_map", name: "Map / Plan", description: "Before/after comparison or layout description" },
] as const;

export const WRITING_TASK2_TYPES = [
  { id: "w2_opinion", name: "Opinion (Agree/Disagree)", description: "Take a clear position and defend it" },
  { id: "w2_discussion", name: "Discussion (Both Views)", description: "Present both sides + your opinion" },
  { id: "w2_advantages", name: "Advantages & Disadvantages", description: "Analyze pros/cons + conclusion" },
  { id: "w2_problem_solution", name: "Problem & Solution", description: "Identify causes + propose solutions" },
  { id: "w2_two_part", name: "Two-Part (Double Question)", description: "Answer 2 separate questions in 1 essay" },
] as const;

export const WRITING_CRITERIA = [
  { id: "ta", name: "Task Achievement", shortName: "TA", description: "Answer the question fully" },
  { id: "cc", name: "Coherence & Cohesion", shortName: "CC", description: "Logical structure, linking" },
  { id: "lr", name: "Lexical Resource", shortName: "LR", description: "Vocabulary range & accuracy" },
  { id: "gra", name: "Grammatical Range & Accuracy", shortName: "GRA", description: "Grammar variety & correctness" },
] as const;

export const WRITING_TOPIC_CATEGORIES = [
  "Education", "Environment", "Technology", "Health", "Society",
  "Government", "Crime & Punishment", "Globalisation", "Work & Career",
  "Media & Advertising", "Housing & Transport", "Arts & Culture",
  "Space & Science", "Family & Children", "Tourism", "Language",
  "Food & Agriculture", "Animal Rights",
] as const;
