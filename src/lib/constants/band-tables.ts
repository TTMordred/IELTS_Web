// Official IELTS Listening band conversion table
// Source: IELTS official scoring guide
const LISTENING_BAND_TABLE: [number, number, number][] = [
  // [minCorrect, maxCorrect, band]
  [39, 40, 9.0],
  [37, 38, 8.5],
  [35, 36, 8.0],
  [32, 34, 7.5],
  [30, 31, 7.0],
  [26, 29, 6.5],
  [23, 25, 6.0],
  [18, 22, 5.5],
  [16, 17, 5.0],
  [13, 15, 4.5],
  [10, 12, 4.0],
  [6, 9, 3.5],
  [4, 5, 3.0],
  [0, 3, 2.5],
];

// Official IELTS Academic Reading band conversion table
const READING_BAND_TABLE: [number, number, number][] = [
  [39, 40, 9.0],
  [37, 38, 8.5],
  [35, 36, 8.0],
  [33, 34, 7.5],
  [30, 32, 7.0],
  [27, 29, 6.5],
  [23, 26, 6.0],
  [19, 22, 5.5],
  [15, 18, 5.0],
  [13, 14, 4.5],
  [10, 12, 4.0],
  [6, 9, 3.5],
  [4, 5, 3.0],
  [0, 3, 2.5],
];

export function scoreToBand(
  score: number,
  skill: "listening" | "reading" = "listening"
): number {
  const table = skill === "listening" ? LISTENING_BAND_TABLE : READING_BAND_TABLE;
  for (const [min, max, band] of table) {
    if (score >= min && score <= max) return band;
  }
  return 0;
}

export function bandToColor(band: number): string {
  if (band >= 7.0) return "#22C55E"; // green
  if (band >= 6.0) return "#EAB308"; // yellow
  if (band >= 5.0) return "#F97316"; // orange
  return "#EF4444"; // red
}
