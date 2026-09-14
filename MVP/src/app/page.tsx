import { TimeLensDashboard } from "@/components/timelens-dashboard";
import type { AnalyticsView, TaskView } from "@/components/dashboard-types";
import { completeTask, createTask, deleteTask, resetDemo, simulateDelay } from "@/app/actions";
import { calculateAnalytics } from "@/lib/analytics";
import { db } from "@/lib/db";
import { predictDuration } from "@/lib/prediction";

export const dynamic = "force-dynamic";

function toTaskView(task: Awaited<ReturnType<typeof db.task.findMany>>[number], history: Awaited<ReturnType<typeof db.taskHistory.findMany>>): TaskView {
  const prediction = predictDuration(
    { category: task.category, estimatedMinutes: task.estimatedMinutes, scheduledStart: task.scheduledStart },
    history,
  );
  const simulatedDelayMinutes = Math.max(0, task.predictedMinutes - prediction.predictedMinutes);
  return {
    ...task,
    priority: task.priority,
    status: task.status,
    deadline: task.deadline.toISOString(),
    scheduledStart: task.scheduledStart?.toISOString() ?? null,
    scheduledEnd: task.scheduledEnd?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt?.toISOString() ?? null,
    deadlineRisk: Boolean(task.scheduledEnd && task.scheduledEnd > task.deadline && task.status === "PENDING"),
    prediction: {
      ...prediction,
      originalEstimate: task.estimatedMinutes,
      explanation: simulatedDelayMinutes
        ? `${prediction.explanation} A simulated ${simulatedDelayMinutes}-minute delay is included in the current timeline.`
        : prediction.explanation,
    },
  };
}

export default async function DashboardPage() {
  const [tasks, history] = await Promise.all([
    db.task.findMany({ orderBy: { createdAt: "asc" } }),
    db.taskHistory.findMany({ orderBy: { completedAt: "desc" } }),
  ]);
  const taskViews = tasks
    .map((task) => toTaskView(task, history))
    .sort((left, right) => (left.scheduledStart ?? "").localeCompare(right.scheduledStart ?? ""));
  const data = calculateAnalytics(history);
  const analytics: AnalyticsView = {
    completedTaskCount: data.completedTaskCount,
    meanAbsoluteError: data.meanAbsoluteError,
    categoryBiases: data.categoryBiases.map(({ category, biasFactor }) => ({ category, factor: biasFactor })),
    durationComparison: data.durationPairs.map(({ title, estimatedMinutes, actualMinutes }) => ({ label: title, estimatedMinutes, actualMinutes })),
  };

  return <TimeLensDashboard tasks={taskViews} analytics={analytics} onCreateTask={createTask} onCompleteTask={completeTask} onDeleteTask={deleteTask} onSimulateDelay={simulateDelay} onResetDemo={resetDemo} />;
}
