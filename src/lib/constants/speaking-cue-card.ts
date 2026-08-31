import type { CueCardType } from "@/lib/types";

export const CUE_CARD_TYPES: CueCardType[] = [
  "Person",
  "Place",
  "Object",
  "Activity",
  "Event",
  "Experience",
  "Skill",
  "Media",
  "Time",
];

export const CUE_CARD_TYPE_LABELS: Record<CueCardType, string> = {
  Person: "A person (friend, family, role model…)",
  Place: "A place (city, room, favourite spot…)",
  Object: "An object or thing",
  Activity: "An activity or hobby",
  Event: "An event or occasion",
  Experience: "An experience or situation",
  Skill: "A skill or ability",
  Media: "Media & technology (movie, app, website…)",
  Time: "A particular time or occasion",
};

// Default storytelling frameworks, seeded per card type but editable per card
// (the stored answer_structure is the source of truth — never hardcoded).
export const DEFAULT_ANSWER_STRUCTURE: Record<CueCardType, string[]> = {
  Person: [
    "Introduction",
    "Who the person is",
    "How I know / met them",
    "What makes them special",
    "How they influenced me",
  ],
  Place: [
    "Introduction",
    "Where it is",
    "What it looks like",
    "What I do there",
    "Why I like it",
  ],
  Object: [
    "Introduction",
    "What it is",
    "When / how I got it",
    "What it looks like",
    "Why it matters to me",
  ],
  Activity: [
    "Introduction",
    "What the activity is",
    "When I started / how often",
    "What it involves",
    "Why I enjoy it",
  ],
  Event: [
    "Introduction",
    "When and where",
    "Who was there",
    "What happened",
    "How I felt about it",
  ],
  Experience: [
    "Introduction",
    "When / where it happened",
    "What led to it",
    "What I did",
    "What I learned / how I felt",
  ],
  Skill: [
    "Introduction",
    "What skill it is",
    "Why I want to learn it",
    "How I plan to learn it",
    "How it will help me",
  ],
  Media: [
    "Introduction",
    "What it is",
    "When I first came across it",
    "What it is like",
    "Why I recommend it",
  ],
  Time: [
    "Introduction",
    "When it was",
    "What was happening",
    "What I did",
    "Why it stands out",
  ],
};

/** Best-guess cue card type from a Topic Bank category label ("Places" → Place). */
export function inferCueCardType(category: string | null | undefined): CueCardType {
  const singular: Record<string, CueCardType> = {
    person: "Person",
    place: "Place",
    object: "Object",
    activity: "Activity",
    event: "Event",
    skill: "Skill",
    media: "Media",
    "media & technology": "Media",
    time: "Time",
  };
  if (category) {
    const key = category.trim().toLowerCase();
    const hit = singular[key] ?? singular[key.replace(/s$/, "")];
    if (hit) return hit;
  }
  return "Experience";
}
