export const SPEAKING_CRITERIA = [
  { id: "fluency", name: "Fluency & Coherence", shortName: "FC", description: "Flow, coherence, hesitation management" },
  { id: "lexical", name: "Lexical Resource", shortName: "LR", description: "Vocabulary range, collocations, paraphrasing" },
  { id: "grammar", name: "Grammatical Range & Accuracy", shortName: "GRA", description: "Grammar variety, error frequency" },
  { id: "pronunciation", name: "Pronunciation", shortName: "PR", description: "Clarity, intonation, stress patterns" },
] as const;

export const SPEAKING_PART1_TOPICS = [
  "Hometown", "Work", "Studies", "Family", "Home/Accommodation",
  "Daily Routine", "Food & Cooking", "Weather", "Hobbies", "Music",
  "Reading", "Sports & Exercise", "Travel", "Technology", "Social Media",
  "Shopping", "Clothes & Fashion", "Friends", "Neighbours", "Languages",
  "Movies/TV", "Arts", "Animals/Pets", "Transportation", "Happiness",
  "Colors", "Time Management", "Sleep", "Rain", "Noise",
  "Concentration", "Patience",
] as const;

export const SPEAKING_PART2_CATEGORIES = [
  { id: "people", name: "People", examples: "Person who inspires you, famous person, family member" },
  { id: "places", name: "Places", examples: "City visited, favourite place, park" },
  { id: "events", name: "Events & Experiences", examples: "Memorable trip, celebration, something learned" },
  { id: "objects", name: "Objects & Things", examples: "Gift, book, something bought online" },
  { id: "activities", name: "Activities & Hobbies", examples: "Sport, skill to learn" },
  { id: "abstract", name: "Abstract & Ideas", examples: "Changed your mind, difficult decision" },
  { id: "media", name: "Media & Technology", examples: "App, website, movie" },
] as const;

export const SPEAKING_ENTRY_TYPES = [
  { value: "practice", label: "Practice" },
  { value: "mock_test", label: "Mock Test" },
  { value: "real_test", label: "Real Test" },
] as const;
