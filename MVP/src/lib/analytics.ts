import type { AnalyticsSummary, HistoricalTask } from "@/types/planning";

/** Derives the small analytics panel directly from persisted completion history. */
export function calculateAnalytics(history: HistoricalTask[]): AnalyticsSummary {
  const categoryMap = new Map<string, HistoricalTask[]>();
  for (const entry of history) {
    const categoryEntries = categoryMap.get(entry.category) ?? [];
    categoryEntries.push(entry);
    categoryMap.set(entry.category, categoryEntries);
  }
  const categoryBiases = [...categoryMap.entries()]
    .map(([category, entries]) => ({
      category,
      completedTaskCount: entries.length,
      biasFactor: Number(
        (entries.reduce((sum, entry) => sum + entry.actualMinutes / Math.max(1, entry.estimatedMinutes), 0) / entries.length).toFixed(2),
      ),
    }))
    .sort((left, right) => left.category.localeCompare(right.category));
  const meanAbsoluteError = history.length
    ? history.reduce((sum, entry) => sum + Math.abs(entry.actualMinutes - entry.estimatedMinutes), 0) / history.length
    : 0;
  return {
    completedTaskCount: history.length,
    meanAbsoluteError: Number(meanAbsoluteError.toFixed(1)),
    categoryBiases,
    durationPairs: history.map((entry) => ({
      title: entry.title,
      category: entry.category,
      estimatedMinutes: entry.estimatedMinutes,
      actualMinutes: entry.actualMinutes,
    })),
  };
}
