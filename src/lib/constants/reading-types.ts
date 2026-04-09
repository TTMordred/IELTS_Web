export type ReadingQuestionType = {
  id: string;
  name: string;
  description: string;
  group: string;
  frequency: "high" | "medium" | "low";
};

export const READING_QUESTION_TYPES: ReadingQuestionType[] = [
  // Group 1: Identifying Information
  { id: "r_tfng", name: "True / False / Not Given", description: "Factual accuracy — is the statement true, false, or not mentioned?", group: "Identifying Information", frequency: "high" },
  { id: "r_ynng", name: "Yes / No / Not Given", description: "Writer's opinions/claims — agree, disagree, or not stated?", group: "Identifying Information", frequency: "high" },

  // Group 2: Matching
  { id: "r_matching_headings", name: "Matching Headings", description: "Choose heading for each paragraph. Extra headings given.", group: "Matching", frequency: "high" },
  { id: "r_matching_info", name: "Matching Information", description: "Match statements to paragraphs containing that info.", group: "Matching", frequency: "high" },
  { id: "r_matching_features", name: "Matching Features", description: "Match statements to people/theories/dates.", group: "Matching", frequency: "medium" },
  { id: "r_matching_sentence_endings", name: "Matching Sentence Endings", description: "Choose correct ending to complete each sentence.", group: "Matching", frequency: "medium" },

  // Group 3: Completion
  { id: "r_summary_completion", name: "Summary Completion", description: "Fill words into summary — from list or from passage.", group: "Completion", frequency: "high" },
  { id: "r_sentence_completion", name: "Sentence Completion", description: "Complete sentences with 1-3 words from passage.", group: "Completion", frequency: "medium" },
  { id: "r_note_completion", name: "Note Completion", description: "Fill words into notes/bullet points format.", group: "Completion", frequency: "low" },
  { id: "r_table_completion", name: "Table Completion", description: "Fill blanks in a table. Info scattered across passage.", group: "Completion", frequency: "low" },
  { id: "r_flowchart_completion", name: "Flow-chart Completion", description: "Fill process/sequence diagram from passage.", group: "Completion", frequency: "low" },
  { id: "r_diagram_labelling", name: "Diagram Labelling", description: "Label a technical/scientific diagram.", group: "Completion", frequency: "low" },

  // Group 4: Selection
  { id: "r_multiple_choice", name: "Multiple Choice", description: "Choose 1 or more answers about detail, main idea, or purpose.", group: "Selection", frequency: "high" },
  { id: "r_short_answer", name: "Short-Answer Questions", description: "Answer in 1-3 words from passage. Who/what/where/when.", group: "Selection", frequency: "low" },
];

export const READING_TYPE_BY_ID = Object.fromEntries(
  READING_QUESTION_TYPES.map((t) => [t.id, t])
);

export const READING_TOPIC_CATEGORIES = [
  "Science & Technology",
  "History & Archaeology",
  "Social Sciences",
  "Environment & Nature",
  "Health & Medicine",
  "Business & Economics",
  "Arts & Culture",
  "Agriculture & Food",
] as const;
