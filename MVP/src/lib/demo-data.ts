import { Priority, TaskStatus } from "@prisma/client";
import { predictDuration } from "@/lib/prediction";

type DemoClock = (hour: number, minute?: number, dayOffset?: number) => Date;

function createDemoClock(now = new Date()): DemoClock {
  return (hour, minute = 0, dayOffset = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  };
}

/**
 * The fixed-but-date-relative data used by both `npm run setup` and Reset demo.
 * Six Technical Report records have a 1.25 ratio and three interruptions each:
 * 60 × 1.25 × 1.15 + 9 = 95 minutes for an afternoon report.
 */
export function getDemoData(now = new Date()) {
  const dayAt = createDemoClock(now);
  const history = [
      { title: "Architecture report", category: "Technical Report", estimatedMinutes: 100, actualMinutes: 125, startHour: 14, interruptionCount: 3, completedAt: dayAt(15, 15, -12) },
      { title: "Database report", category: "Technical Report", estimatedMinutes: 80, actualMinutes: 100, startHour: 15, interruptionCount: 3, completedAt: dayAt(17, 0, -9) },
      { title: "Testing report", category: "Technical Report", estimatedMinutes: 40, actualMinutes: 50, startHour: 13, interruptionCount: 3, completedAt: dayAt(14, 0, -6) },
      { title: "Security report", category: "Technical Report", estimatedMinutes: 20, actualMinutes: 25, startHour: 14, interruptionCount: 3, completedAt: dayAt(14, 25, -5) },
      { title: "Performance report", category: "Technical Report", estimatedMinutes: 100, actualMinutes: 125, startHour: 15, interruptionCount: 3, completedAt: dayAt(17, 5, -4) },
      { title: "Research report", category: "Technical Report", estimatedMinutes: 100, actualMinutes: 125, startHour: 13, interruptionCount: 3, completedAt: dayAt(13, 50, -3) },
      { title: "API integration", category: "Coding", estimatedMinutes: 90, actualMinutes: 108, startHour: 10, interruptionCount: 1, completedAt: dayAt(11, 48, -10) },
      { title: "Fix responsive layout", category: "Coding", estimatedMinutes: 45, actualMinutes: 54, startHour: 11, interruptionCount: 1, completedAt: dayAt(11, 54, -7) },
      { title: "Exam revision", category: "Revision", estimatedMinutes: 60, actualMinutes: 66, startHour: 18, interruptionCount: 2, completedAt: dayAt(19, 6, -8) },
      { title: "Lecture notes review", category: "Revision", estimatedMinutes: 30, actualMinutes: 33, startHour: 17, interruptionCount: 1, completedAt: dayAt(17, 33, -5) },
      { title: "Email and forms", category: "Administration", estimatedMinutes: 30, actualMinutes: 36, startHour: 9, interruptionCount: 2, completedAt: dayAt(9, 36, -4) },
      { title: "Project submission", category: "Administration", estimatedMinutes: 20, actualMinutes: 24, startHour: 10, interruptionCount: 1, completedAt: dayAt(10, 24, -2) },
  ];

  // These seed tasks are scheduled with the same general predictor as newly
  // created work. They place a newly added report after noon, allowing its
  // afternoon factor to be visible in the live demonstration.
  const drafts = [
    { title: "Implement dashboard interactions", category: "Coding", estimatedMinutes: 75, priority: Priority.HIGH, deadline: dayAt(13), interruptionCount: 1 },
    { title: "Rehearse project walkthrough", category: "Coding", estimatedMinutes: 90, priority: Priority.HIGH, deadline: dayAt(14), interruptionCount: 1 },
    { title: "Prepare presentation slides", category: "Revision", estimatedMinutes: 45, priority: Priority.HIGH, deadline: dayAt(16), interruptionCount: 1 },
    { title: "Send supervisor update", category: "Administration", estimatedMinutes: 25, priority: Priority.MEDIUM, deadline: dayAt(17), interruptionCount: 1 },
  ];
  let cursor = dayAt(9);
  const tasks = drafts.map((task) => {
    const scheduledStart = new Date(cursor);
    const predictedMinutes = predictDuration({ ...task, scheduledStart }, history).predictedMinutes;
    const scheduledEnd = new Date(scheduledStart.getTime() + predictedMinutes * 60_000);
    cursor = scheduledEnd;
    return { ...task, predictedMinutes, scheduledStart, scheduledEnd, status: TaskStatus.PENDING };
  });

  return { history, tasks };
}
