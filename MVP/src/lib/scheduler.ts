import type { DateLike, PlanningTask, ScheduleResult, ScheduledTask } from "@/types/planning";

export const DAY_START_HOUR = 9;
/** Within this window, priority resolves an otherwise closely competing deadline. */
export const SIMILAR_DEADLINE_WINDOW_MINUTES = 120;

const priorityWeight = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

function asDate(value: DateLike): Date {
  return value instanceof Date ? new Date(value) : new Date(value);
}

function startOfPlanningDay(day: DateLike): Date {
  const date = asDate(day);
  date.setHours(DAY_START_HOUR, 0, 0, 0);
  return date;
}

function planningDayFrom(tasks: PlanningTask[], suppliedDay?: DateLike): Date {
  if (suppliedDay) return startOfPlanningDay(suppliedDay);
  const firstDeadline = tasks
    .filter((task) => task.status === "PENDING")
    .map((task) => asDate(task.deadline))
    .sort((left, right) => left.getTime() - right.getTime())[0];
  return startOfPlanningDay(firstDeadline ?? new Date());
}

/** A stable comparator makes identical task input result in an identical plan. */
export function compareTasksForSchedule(left: PlanningTask, right: PlanningTask): number {
  const deadlineDifference = asDate(left.deadline).getTime() - asDate(right.deadline).getTime();
  if (Math.abs(deadlineDifference) > SIMILAR_DEADLINE_WINDOW_MINUTES * 60_000) return deadlineDifference;
  const priorityDifference = priorityWeight[left.priority] - priorityWeight[right.priority];
  if (priorityDifference !== 0) return priorityDifference;
  if (deadlineDifference !== 0) return deadlineDifference;
  return left.id.localeCompare(right.id);
}

/**
 * Rebuilds a single-day sequential plan. Completed tasks are copied through
 * without changing their persisted scheduling fields.
 */
export function buildSchedule(tasks: PlanningTask[], planningDay?: DateLike): ScheduleResult {
  const pending = tasks.filter((task) => task.status === "PENDING").sort(compareTasksForSchedule);
  const planned = new Map<string, ScheduledTask>();
  let cursor = planningDayFrom(tasks, planningDay);

  for (const task of pending) {
    const scheduledStart = new Date(cursor);
    const scheduledEnd = new Date(scheduledStart.getTime() + Math.max(1, task.predictedMinutes) * 60_000);
    const isDeadlineRisk = scheduledEnd.getTime() > asDate(task.deadline).getTime();
    planned.set(task.id, { ...task, scheduledStart, scheduledEnd, isDeadlineRisk });
    cursor = scheduledEnd;
  }

  const scheduledTasks = tasks.map((task) => {
    const scheduled = planned.get(task.id);
    if (scheduled) return scheduled;
    return {
      ...task,
      scheduledStart: task.scheduledStart ? asDate(task.scheduledStart) : null,
      scheduledEnd: task.scheduledEnd ? asDate(task.scheduledEnd) : null,
      isDeadlineRisk: task.scheduledEnd ? asDate(task.scheduledEnd).getTime() > asDate(task.deadline).getTime() : false,
    };
  });
  return {
    tasks: scheduledTasks,
    deadlineRiskCount: scheduledTasks.filter((task) => task.status === "PENDING" && task.isDeadlineRisk).length,
  };
}

/** Compatibility helper for consumers that only need the scheduled array. */
export function scheduleTasks(tasks: PlanningTask[], planningDay?: DateLike): ScheduledTask[] {
  return buildSchedule(tasks, planningDay).tasks;
}

/**
 * Applies an observed delay to the active task and every pending task after it.
 * It leaves completed tasks entirely untouched, including their timestamps.
 */
export function shiftScheduleAfterDelay(
  tasks: ScheduledTask[],
  delayedTaskId: string,
  delayMinutes: number,
): ScheduledTask[] {
  const delayed = tasks.find((task) => task.id === delayedTaskId);
  if (!delayed || delayed.status === "COMPLETED" || !delayed.scheduledEnd || delayMinutes <= 0) return tasks.map((task) => ({ ...task }));
  const originalEnd = asDate(delayed.scheduledEnd).getTime();
  const delayMs = Math.round(delayMinutes) * 60_000;

  return tasks.map((task) => {
    if (task.status === "COMPLETED") return { ...task };
    const start = task.scheduledStart ? asDate(task.scheduledStart) : null;
    const end = task.scheduledEnd ? asDate(task.scheduledEnd) : null;
    const shouldShift = task.id === delayedTaskId || (start !== null && start.getTime() >= originalEnd);
    if (!shouldShift) return { ...task, scheduledStart: start, scheduledEnd: end };
    const shiftedStart = task.id === delayedTaskId ? start : new Date(start!.getTime() + delayMs);
    const shiftedEnd = end ? new Date(end.getTime() + delayMs) : null;
    return {
      ...task,
      scheduledStart: shiftedStart,
      scheduledEnd: shiftedEnd,
      isDeadlineRisk: shiftedEnd ? shiftedEnd.getTime() > asDate(task.deadline).getTime() : false,
    };
  });
}
