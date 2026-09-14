import { describe, expect, it } from "vitest";
import { buildSchedule, shiftScheduleAfterDelay } from "../src/lib/scheduler";
import type { PlanningTask } from "../src/types/planning";

const day = new Date(2026, 8, 15, 0, 0);
const task = (overrides: Partial<PlanningTask>): PlanningTask => ({
  id: "base",
  title: "Task",
  category: "Coding",
  estimatedMinutes: 30,
  predictedMinutes: 30,
  priority: "MEDIUM",
  deadline: new Date(2026, 8, 15, 17, 0),
  status: "PENDING",
  interruptionCount: 0,
  ...overrides,
});

describe("buildSchedule", () => {
  it("orders pending tasks by deadline", () => {
    const result = buildSchedule([
      task({ id: "late", deadline: new Date(2026, 8, 15, 17, 0) }),
      task({ id: "early", deadline: new Date(2026, 8, 15, 12, 0) }),
    ], day);
    expect(result.tasks.find((entry) => entry.id === "early")?.scheduledStart?.getTime()).toBeLessThan(
      result.tasks.find((entry) => entry.id === "late")!.scheduledStart!.getTime(),
    );
  });

  it("uses priority to break closely competing deadlines", () => {
    const result = buildSchedule([
      task({ id: "low", priority: "LOW", deadline: new Date(2026, 8, 15, 15, 0) }),
      task({ id: "high", priority: "HIGH", deadline: new Date(2026, 8, 15, 15, 30) }),
    ], day);
    expect(result.tasks.find((entry) => entry.id === "high")?.scheduledStart?.getTime()).toBeLessThan(
      result.tasks.find((entry) => entry.id === "low")!.scheduledStart!.getTime(),
    );
  });

  it("does not alter completed tasks while rebuilding a plan", () => {
    const completedStart = new Date(2026, 8, 14, 11, 0);
    const result = buildSchedule([
      task({ id: "done", status: "COMPLETED", scheduledStart: completedStart, scheduledEnd: new Date(2026, 8, 14, 11, 30) }),
      task({ id: "todo" }),
    ], day);
    const completed = result.tasks.find((entry) => entry.id === "done")!;
    expect(completed.scheduledStart?.getTime()).toBe(completedStart.getTime());
    expect(completed.scheduledEnd?.getTime()).toBe(new Date(2026, 8, 14, 11, 30).getTime());
  });
});

describe("shiftScheduleAfterDelay", () => {
  it("shifts the delayed task and every later pending task by 35 minutes", () => {
    const scheduled = buildSchedule([
      task({ id: "one", predictedMinutes: 30 }),
      task({ id: "two", predictedMinutes: 45, deadline: new Date(2026, 8, 15, 18, 0) }),
      task({ id: "three", predictedMinutes: 20, deadline: new Date(2026, 8, 15, 20, 0) }),
    ], day).tasks;
    const shifted = shiftScheduleAfterDelay(scheduled, "one", 35);
    expect(shifted.find((entry) => entry.id === "one")?.scheduledEnd?.getTime()).toBe(
      scheduled.find((entry) => entry.id === "one")!.scheduledEnd!.getTime() + 35 * 60_000,
    );
    expect(shifted.find((entry) => entry.id === "two")?.scheduledStart?.getTime()).toBe(
      scheduled.find((entry) => entry.id === "two")!.scheduledStart!.getTime() + 35 * 60_000,
    );
    expect(shifted.find((entry) => entry.id === "three")?.scheduledStart?.getTime()).toBe(
      scheduled.find((entry) => entry.id === "three")!.scheduledStart!.getTime() + 35 * 60_000,
    );
  });

  it("keeps completed tasks unchanged when a later task is delayed", () => {
    const completedStart = new Date(2026, 8, 15, 8, 0);
    const scheduled = buildSchedule([
      task({ id: "done", status: "COMPLETED", scheduledStart: completedStart, scheduledEnd: new Date(2026, 8, 15, 8, 30) }),
      task({ id: "active" }),
    ], day).tasks;
    const shifted = shiftScheduleAfterDelay(scheduled, "active", 35);
    expect(shifted.find((entry) => entry.id === "done")?.scheduledStart?.getTime()).toBe(completedStart.getTime());
  });
});
