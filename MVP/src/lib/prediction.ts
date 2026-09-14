import type {
  Confidence,
  DateLike,
  HistoricalTask,
  PredictionInput,
  PredictionResult,
} from "@/types/planning";

/**
 * An explainable statistical baseline, not a trained machine-learning model.
 * A category's median actual/estimated ratio is blended toward 1.10 until six
 * historical examples exist, so an isolated task cannot dominate a prediction.
 */
export const DEFAULT_CATEGORY_BIAS = 1.1;
export const MORNING_FACTOR = 0.95;
export const AFTERNOON_FACTOR = 1.15;
export const EVENING_FACTOR = 1.05;
export const HISTORY_FOR_FULL_WEIGHT = 6;
export const INTERRUPTION_MINUTES = 3;
export const MAX_INTERRUPTION_OVERHEAD = 15;
export const MIN_PREDICTED_MINUTES = 5;
export const MAX_DURATION_MULTIPLIER = 3;

function asDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

function median(values: number[]): number {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

export function timeOfDayFor(date?: DateLike | null): "morning" | "afternoon" | "evening" {
  if (!date) return "afternoon";
  const hour = asDate(date).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

export function getTimeOfDayFactor(date?: DateLike | null): number {
  switch (timeOfDayFor(date)) {
    case "morning":
      return MORNING_FACTOR;
    case "afternoon":
      return AFTERNOON_FACTOR;
    default:
      return EVENING_FACTOR;
  }
}

export function predictDuration(
  input: PredictionInput,
  history: HistoricalTask[],
): PredictionResult {
  const estimate = Math.max(1, input.estimatedMinutes);
  const categoryHistory = history.filter(
    (entry) => entry.category.trim().toLowerCase() === input.category.trim().toLowerCase() && entry.estimatedMinutes > 0,
  );
  const ratios = categoryHistory.map((entry) => entry.actualMinutes / entry.estimatedMinutes);
  const observedBias = ratios.length ? median(ratios) : DEFAULT_CATEGORY_BIAS;
  const historyWeight = Math.min(categoryHistory.length / HISTORY_FOR_FULL_WEIGHT, 1);
  const categoryBiasFactor = DEFAULT_CATEGORY_BIAS + (observedBias - DEFAULT_CATEGORY_BIAS) * historyWeight;
  const timeOfDayFactor = getTimeOfDayFactor(input.scheduledStart);
  const averageInterruptions = categoryHistory.length
    ? categoryHistory.reduce((total, entry) => total + Math.max(0, entry.interruptionCount), 0) / categoryHistory.length
    : 0;
  const interruptionOverhead = Math.min(
    Math.round(averageInterruptions * INTERRUPTION_MINUTES),
    MAX_INTERRUPTION_OVERHEAD,
  );
  const unboundedPrediction = estimate * categoryBiasFactor * timeOfDayFactor + interruptionOverhead;
  const predictedMinutes = Math.round(
    Math.min(
      Math.max(unboundedPrediction, MIN_PREDICTED_MINUTES),
      estimate * MAX_DURATION_MULTIPLIER,
    ),
  );
  const confidence: Confidence = categoryHistory.length >= 6 ? "HIGH" : categoryHistory.length >= 3 ? "MEDIUM" : "LOW";
  const percentageDifference = Math.round((categoryBiasFactor - 1) * 100);
  const categoryStatement = categoryHistory.length
    ? `You usually take ${Math.abs(percentageDifference)}% ${percentageDifference >= 0 ? "longer" : "less time"} than estimated for ${input.category} tasks.`
    : `There is not enough ${input.category} history yet, so TimeLens uses its 10% planning buffer.`;
  const timeStatement = `Since this task is scheduled in the ${timeOfDayFor(input.scheduledStart)}, TimeLens predicts ${predictedMinutes} minutes instead of ${estimate} minutes.`;

  return {
    predictedMinutes,
    originalEstimate: estimate,
    categoryBiasFactor: Number(categoryBiasFactor.toFixed(2)),
    timeOfDayFactor,
    interruptionOverhead,
    confidence,
    explanation: `${categoryStatement} ${timeStatement}`,
  };
}
