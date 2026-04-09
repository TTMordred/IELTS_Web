export const XP_REWARDS = {
  log_listening: 20,
  log_reading: 20,
  log_speaking: 25,
  log_writing: 25,
  add_vocab: 5,
  review_vocab: 3,
  add_grammar_note: 8,
  daily_goal: 15,
  streak_bonus_per_day: 2,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Beginner" },
  { level: 2, xp: 50, title: "Beginner" },
  { level: 3, xp: 120, title: "Beginner" },
  { level: 4, xp: 200, title: "Beginner" },
  { level: 5, xp: 300, title: "Beginner" },
  { level: 6, xp: 500, title: "Elementary" },
  { level: 7, xp: 700, title: "Elementary" },
  { level: 8, xp: 900, title: "Elementary" },
  { level: 9, xp: 1100, title: "Elementary" },
  { level: 10, xp: 1500, title: "Elementary" },
  { level: 11, xp: 2000, title: "Intermediate" },
  { level: 15, xp: 3500, title: "Intermediate" },
  { level: 20, xp: 5000, title: "Intermediate" },
  { level: 21, xp: 6000, title: "Upper-Inter" },
  { level: 25, xp: 8000, title: "Upper-Inter" },
  { level: 30, xp: 12000, title: "Upper-Inter" },
  { level: 31, xp: 14000, title: "Advanced" },
  { level: 35, xp: 18000, title: "Advanced" },
  { level: 40, xp: 25000, title: "Advanced" },
  { level: 41, xp: 28000, title: "IELTS Master" },
  { level: 45, xp: 35000, title: "IELTS Master" },
  { level: 50, xp: 50000, title: "IELTS Master" },
];

export function getLevel(xp: number): { level: number; title: string; xpForNext: number; progress: number } {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1];
    }
  }

  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp) {
    const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return { level: last.level, title: last.title, xpForNext: 0, progress: 100 };
  }

  const xpInLevel = xp - currentLevel.xp;
  const xpNeeded = nextLevel.xp - currentLevel.xp;
  const progress = xpNeeded > 0 ? Math.round((xpInLevel / xpNeeded) * 100) : 0;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpForNext: nextLevel.xp - xp,
    progress,
  };
}

export type BadgeDef = {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "milestone" | "streak" | "module" | "band" | "vocab" | "mastery";
};

export const BADGES: BadgeDef[] = [
  { id: "first_blood", name: "First Blood", icon: "target", description: "Log your first record", category: "milestone" },
  { id: "streak_7", name: "7-Day Streak", icon: "flame", description: "Study 7 consecutive days", category: "streak" },
  { id: "streak_30", name: "30-Day Streak", icon: "flame", description: "Study 30 consecutive days", category: "streak" },
  { id: "vocab_100", name: "Vocab Collector", icon: "book-marked", description: "Add 100 vocab cards", category: "vocab" },
  { id: "vocab_500", name: "Vocab Master", icon: "book-marked", description: "Add 500 vocab cards", category: "vocab" },
  { id: "listening_20", name: "Listening Pro", icon: "headphones", description: "Log 20 listening records", category: "module" },
  { id: "reading_20", name: "Reading Pro", icon: "book-open", description: "Log 20 reading records", category: "module" },
  { id: "band_6", name: "Band 6 Breaker", icon: "trending-up", description: "Estimated band reaches 6.0", category: "band" },
  { id: "band_7", name: "Band 7 Breaker", icon: "trending-up", description: "Estimated band reaches 7.0", category: "band" },
  { id: "all_rounder", name: "All-Rounder", icon: "trophy", description: "Log records in all 4 modules in 1 week", category: "milestone" },
  { id: "grammar_guru", name: "Grammar Guru", icon: "brain", description: "Notes in all 14 grammar categories", category: "mastery" },
  { id: "map_master", name: "Map Master", icon: "map", description: "80%+ accuracy on Map Labelling", category: "mastery" },
];
