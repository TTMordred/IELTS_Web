import { ALL_QUESTION_TYPES } from "@/lib/constants/listening-types";
import { READING_QUESTION_TYPES } from "@/lib/constants/reading-types";

type TypeAccuracy = {
  questionType: string;
  accuracy: number; // 0-1
  attempts: number;
  frequency: "high" | "medium" | "low";
};

/**
 * Readiness Score — a "true band" estimate that factors in:
 * 1. Un-attempted question types (penalized by exam frequency weight)
 * 2. Consistency (standard deviation penalty)
 * 3. Trend direction (improving = bonus, declining = penalty)
 * 4. Data sufficiency (fewer data points = lower confidence)
 *
 * Formula: readiness = weighted_avg - gap_penalty - volatility_penalty + trend_bonus
 */
export function calculateReadinessScore(
  typeAccuracies: TypeAccuracy[],
  currentBand: number
): {
  readinessScore: number;
  confidence: "high" | "medium" | "low";
  gapPenalty: number;
  volatilityPenalty: number;
  trendBonus: number;
  unattemptedTypes: string[];
  weakTypes: string[];
  dataPoints: number;
} {
  // All 41 question types
  const allTypes = [
    ...ALL_QUESTION_TYPES.map((t) => ({ id: t.id, frequency: t.frequency })),
    ...READING_QUESTION_TYPES.map((t) => ({ id: t.id, frequency: t.frequency })),
  ];

  const frequencyWeight: Record<string, number> = { high: 1.0, medium: 0.6, low: 0.3 };

  // Map accuracies by type
  const accMap = new Map(typeAccuracies.map((a) => [a.questionType, a]));

  // 1. Weighted average of attempted types
  let weightedSum = 0;
  let totalWeight = 0;
  const unattemptedTypes: string[] = [];
  const weakTypes: string[] = [];

  for (const type of allTypes) {
    const acc = accMap.get(type.id);
    const weight = frequencyWeight[type.frequency];

    if (!acc || acc.attempts < 3) {
      unattemptedTypes.push(type.id);
      // Penalize unattempted high-frequency types more
      weightedSum += 0.4 * weight; // assume 40% for unknown types
      totalWeight += weight;
    } else {
      weightedSum += acc.accuracy * weight;
      totalWeight += weight;
      if (acc.accuracy < 0.5) weakTypes.push(type.id);
    }
  }

  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // 2. Gap penalty — more unattempted types = bigger penalty
  const gapRatio = unattemptedTypes.length / allTypes.length;
  const gapPenalty = gapRatio * 0.15; // max 15% penalty if everything unattempted

  // 3. Volatility penalty — high std deviation in scores = less reliable
  const attemptedAccuracies = typeAccuracies
    .filter((a) => a.attempts >= 3)
    .map((a) => a.accuracy);

  let volatilityPenalty = 0;
  if (attemptedAccuracies.length > 2) {
    const mean = attemptedAccuracies.reduce((a, b) => a + b, 0) / attemptedAccuracies.length;
    const variance = attemptedAccuracies.reduce((sum, v) => sum + (v - mean) ** 2, 0) / attemptedAccuracies.length;
    const stdDev = Math.sqrt(variance);
    volatilityPenalty = Math.min(stdDev * 0.1, 0.05); // max 5% penalty
  }

  // 4. Trend bonus — placeholder (requires historical data)
  // Positive if recent scores are higher than older scores
  const trendBonus = 0; // Will be computed when we have time-series data

  // 5. Final readiness as a band score
  const rawReadiness = weightedAvg - gapPenalty - volatilityPenalty + trendBonus;
  const readinessAsBand = Math.max(1, Math.min(9, rawReadiness * 9));
  const readinessScore = Math.round(readinessAsBand * 2) / 2; // round to 0.5

  // Confidence level based on data sufficiency
  const totalDataPoints = typeAccuracies.reduce((sum, a) => sum + a.attempts, 0);
  const confidence: "high" | "medium" | "low" =
    totalDataPoints >= 50 && unattemptedTypes.length <= 10
      ? "high"
      : totalDataPoints >= 20
        ? "medium"
        : "low";

  return {
    readinessScore,
    confidence,
    gapPenalty: Math.round(gapPenalty * 100),
    volatilityPenalty: Math.round(volatilityPenalty * 100),
    trendBonus: Math.round(trendBonus * 100),
    unattemptedTypes,
    weakTypes,
    dataPoints: totalDataPoints,
  };
}
