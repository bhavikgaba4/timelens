import { describe, expect, it } from "vitest";
import {
  AFTERNOON_FACTOR,
  DEFAULT_CATEGORY_BIAS,
  MAX_DURATION_MULTIPLIER,
  getTimeOfDayFactor,
  predictDuration,
} from "../src/lib/prediction";
import type { HistoricalTask } from "../src/types/planning";

const afternoon = new Date(2026, 8, 15, 14, 0);
const reports: HistoricalTask[] = Array.from({ length: 6 }, (_, index) => ({
  id: `report-${index}`,
  title: `Report ${index}`,
  category: "Technical Report",
  estimatedMinutes: 60,
  actualMinutes: 75,
  startHour: 14,
  interruptionCount: 3,
  completedAt: new Date(2026, 7, index + 1, 14, 0),
}));

describe("predictDuration", () => {
  it("uses the explainable cold-start default without interruption overhead", () => {
    const result = predictDuration(
      { category: "New category", estimatedMinutes: 60, scheduledStart: afternoon },
      [],
    );
    expect(result.categoryBiasFactor).toBe(DEFAULT_CATEGORY_BIAS);
    expect(result.interruptionOverhead).toBe(0);
    expect(result.confidence).toBe("LOW");
    expect(result.predictedMinutes).toBe(Math.round(60 * DEFAULT_CATEGORY_BIAS * AFTERNOON_FACTOR));
  });

  it("learns a historical category bias and naturally predicts about 95 minutes", () => {
    const result = predictDuration(
      { category: "Technical Report", estimatedMinutes: 60, scheduledStart: afternoon },
      reports,
    );
    expect(result.categoryBiasFactor).toBe(1.25);
    expect(result.interruptionOverhead).toBe(9);
    expect(result.predictedMinutes).toBe(95);
    expect(result.confidence).toBe("HIGH");
  });

  it("applies the lower morning factor and higher afternoon factor", () => {
    expect(getTimeOfDayFactor(new Date(2026, 8, 15, 9, 0))).toBe(0.95);
    expect(getTimeOfDayFactor(afternoon)).toBe(1.15);
    const morning = predictDuration({ category: "Technical Report", estimatedMinutes: 60, scheduledStart: new Date(2026, 8, 15, 9, 0) }, reports);
    const later = predictDuration({ category: "Technical Report", estimatedMinutes: 60, scheduledStart: afternoon }, reports);
    expect(morning.predictedMinutes).toBeLessThan(later.predictedMinutes);
  });

  it("clamps unusually large historical predictions to a reasonable upper limit", () => {
    const extreme: HistoricalTask[] = [{
      ...reports[0],
      estimatedMinutes: 1,
      actualMinutes: 100,
      interruptionCount: 100,
    }];
    const result = predictDuration({ category: "Technical Report", estimatedMinutes: 20, scheduledStart: afternoon }, extreme);
    expect(result.predictedMinutes).toBe(20 * MAX_DURATION_MULTIPLIER);
  });
});
