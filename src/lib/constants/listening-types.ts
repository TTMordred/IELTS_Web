export type ListeningQuestionType = {
  id: string;
  name: string;
  description: string;
  frequency: "high" | "medium" | "low";
};

export type ListeningSection = {
  section: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  difficulty: string;
  types: ListeningQuestionType[];
};

export const LISTENING_SECTIONS: ListeningSection[] = [
  {
    section: 1,
    title: "Everyday Conversation",
    description: "2 people — booking, enquiry, registration",
    difficulty: "Easy",
    types: [
      { id: "s1_form_completion", name: "Form / Note Completion", description: "Fill in details: name, address, phone, date, price", frequency: "high" },
      { id: "s1_table_completion", name: "Table Completion", description: "Fill table comparing options (price, time, location)", frequency: "high" },
      { id: "s1_multiple_choice_single", name: "Multiple Choice (1 answer)", description: "Choose A/B/C for main idea or specific detail", frequency: "medium" },
      { id: "s1_matching", name: "Matching", description: "Match items with descriptions or categories", frequency: "medium" },
      { id: "s1_short_answer", name: "Short-Answer Questions", description: "Answer in 1-3 words: location, price, time", frequency: "low" },
    ],
  },
  {
    section: 2,
    title: "Everyday Monologue",
    description: "1 person — tour guide, facility intro, event guide",
    difficulty: "Medium",
    types: [
      { id: "s2_multiple_choice_single", name: "Multiple Choice (1 answer)", description: "Choose A/B/C about facilities, services, events", frequency: "high" },
      { id: "s2_multiple_choice_multi", name: "Multiple Choice (2+ answers)", description: "Select 2-3 from longer list (A-E or A-G)", frequency: "medium" },
      { id: "s2_map_labelling", name: "Map / Plan / Diagram Labelling", description: "Label map/plan using direction words (opposite, next to)", frequency: "high" },
      { id: "s2_matching", name: "Matching", description: "Match activities with days, items with categories", frequency: "medium" },
      { id: "s2_sentence_completion", name: "Sentence Completion", description: "Complete sentences with 1-2 words from audio", frequency: "medium" },
      { id: "s2_short_answer", name: "Short-Answer Questions", description: "Direct short answers to questions", frequency: "low" },
    ],
  },
  {
    section: 3,
    title: "Academic Conversation",
    description: "2-4 people — tutorial, project discussion, research",
    difficulty: "Hard",
    types: [
      { id: "s3_multiple_choice_single", name: "Multiple Choice (1 answer)", description: "Opinions, attitudes, reasons — many distractors", frequency: "high" },
      { id: "s3_multiple_choice_multi", name: "Multiple Choice (2+ answers)", description: "Advantages, problems, recommendations from list", frequency: "medium" },
      { id: "s3_matching", name: "Matching", description: "Match speakers/topics with opinions. Distinguish who said what", frequency: "high" },
      { id: "s3_note_completion", name: "Note / Form Completion", description: "Fill discussion/tutorial notes. Academic vocabulary", frequency: "medium" },
      { id: "s3_table_completion", name: "Table Completion", description: "Complete comparison table (research methods, pros/cons)", frequency: "medium" },
      { id: "s3_sentence_completion", name: "Sentence Completion", description: "Summarize discussion points in completed sentences", frequency: "low" },
      { id: "s3_diagram_labelling", name: "Diagram / Flow-chart Labelling", description: "Label process diagrams or technical illustrations", frequency: "low" },
    ],
  },
  {
    section: 4,
    title: "Academic Monologue / Lecture",
    description: "1 person — lecture, no breaks, heavy paraphrasing",
    difficulty: "Hardest",
    types: [
      { id: "s4_note_completion", name: "Note Completion", description: "Fill lecture notes continuously — no breaks", frequency: "high" },
      { id: "s4_summary_completion", name: "Summary Completion", description: "Fill summary paragraph. Understand main ideas + paraphrasing", frequency: "high" },
      { id: "s4_sentence_completion", name: "Sentence Completion", description: "Complete sentences from lecture. Academic vocab", frequency: "high" },
      { id: "s4_multiple_choice_single", name: "Multiple Choice (1 answer)", description: "Main idea, speaker's purpose, conclusions", frequency: "medium" },
      { id: "s4_multiple_choice_multi", name: "Multiple Choice (2+ answers)", description: "Findings, factors, features from list", frequency: "low" },
      { id: "s4_table_completion", name: "Table Completion", description: "Fill classification/comparison table from lecture", frequency: "medium" },
      { id: "s4_flowchart_completion", name: "Flow-chart Completion", description: "Fill process stages, timeline. Follow arrows", frequency: "medium" },
      { id: "s4_matching", name: "Matching", description: "Match concepts/examples with categories", frequency: "low" },
      { id: "s4_diagram_labelling", name: "Diagram Labelling", description: "Label scientific diagram or technical illustration", frequency: "low" },
    ],
  },
];

export const ALL_QUESTION_TYPES = LISTENING_SECTIONS.flatMap((s) =>
  s.types.map((t) => ({ ...t, section: s.section }))
);

export const QUESTION_TYPE_BY_ID = Object.fromEntries(
  ALL_QUESTION_TYPES.map((t) => [t.id, t])
);

export const TEST_SOURCES = [
  { value: "cambridge", label: "Cambridge IELTS" },
  { value: "study4", label: "Study4" },
  { value: "ielts_ot", label: "IELTS Online Tests" },
  { value: "british_council", label: "British Council" },
  { value: "book", label: "Practice Book" },
  { value: "other", label: "Other" },
] as const;
