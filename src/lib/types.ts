export type Profile = {
  id: string;
  display_name: string;
  target_band: number | null;
  current_est_band: number | null;
  exam_date: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active: string | null;
  role: "user" | "admin";
  created_at: string;
};

export type ListeningRecord = {
  id: string;
  user_id: string;
  date: string;
  source: string;
  test_name: string;
  link: string | null;
  total_score: number;
  estimated_band: number | null;
  reflection: string | null;
  self_rating: number | null;
  created_at: string;
};

export type ListeningSectionDetail = {
  id: string;
  record_id: string;
  section: 1 | 2 | 3 | 4;
  section_score: number;
  notes: string | null;
};

export type ListeningTypeResult = {
  id: string;
  section_detail_id: string;
  question_type: string;
  correct: number;
  total: number;
  mistakes_note: string | null;
};

export type VocabCard = {
  id: string;
  user_id: string;
  word: string;
  meaning: string;
  example: string | null;
  topic: string | null;
  tags: string[];
  mastery: number;
  next_review: string | null;
  review_count: number;
  source: string | null;
  created_at: string;
};

export type DailyActivity = {
  id: string;
  user_id: string;
  date: string;
  xp_earned: number;
  listening_count: number;
  reading_count: number;
  speaking_count: number;
  writing_count: number;
  vocab_reviewed: number;
  notes_added: number;
};

// ── Reading Module ──
export type ReadingRecord = {
  id: string;
  user_id: string;
  date: string;
  source: string;
  test_name: string;
  link: string | null;
  total_score: number;
  estimated_band: number | null;
  total_time_min: number | null;
  reflection: string | null;
  self_rating: number | null;
  created_at: string;
};

export type ReadingPassageDetail = {
  id: string;
  record_id: string;
  passage_num: 1 | 2 | 3;
  passage_topic: string | null;
  passage_score: number;
  time_spent_min: number | null;
  notes: string | null;
};

export type ReadingTypeResult = {
  id: string;
  passage_detail_id: string;
  question_type: string;
  correct: number;
  total: number;
  mistakes_note: string | null;
};

// ── Writing Module ──
export type WritingEntry = {
  id: string;
  user_id: string;
  date: string;
  task_type: "task1" | "task2";
  sub_type: string;
  topic: string | null;
  topic_category: string | null;
  question_text: string | null;
  essay_content: string | null;
  word_count: number | null;
  time_spent_min: number | null;
  estimated_band: number | null;
  ta_score: number | null;
  cc_score: number | null;
  lr_score: number | null;
  gra_score: number | null;
  feedback: string | null;
  created_at: string;
};

// ── Speaking Module ──
export type SpeakingEntry = {
  id: string;
  user_id: string;
  date: string;
  type: "practice" | "mock_test" | "real_test";
  estimated_band: number | null;
  fluency_score: number | null;
  lexical_score: number | null;
  grammar_score: number | null;
  pronunciation_score: number | null;
  reflection: string | null;
  created_at: string;
};

export type SpeakingPartDetail = {
  id: string;
  entry_id: string;
  part: 1 | 2 | 3;
  topic: string | null;
  topic_category: string | null;
  notes: string | null;
  recording_url: string | null;
};

// ── Grammar Notes ──
export type GrammarNote = {
  id: string;
  user_id: string;
  category: string;
  rule: string;
  correct_examples: string[];
  common_mistakes: string[];
  source: string | null;
  mastery_level: number;
  created_at: string;
};

// ── Global Topics (Marketplace) ──
export type GlobalTopic = {
  id: string;
  name: string;
  module: "speaking" | "vocab";
  part: 1 | 2 | 3 | null;
  category: string | null;
  sample_questions: string[];
  created_by: string | null;
  is_forecast: boolean;
  forecast_quarter: string | null;
  created_at: string;
  // Joined fields
  topic_upvotes?: { count: number }[];
  user_has_upvoted?: boolean;
};

export type TopicUpvote = {
  user_id: string;
  topic_id: string;
  created_at: string;
};
