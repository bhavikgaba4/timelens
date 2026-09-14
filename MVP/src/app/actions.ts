"use server";

import { Priority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getDemoData } from "@/lib/demo-data";
import { db } from "@/lib/db";
import { predictDuration } from "@/lib/prediction";
import { buildSchedule, shiftScheduleAfterDelay } from "@/lib/scheduler";
import type { PlanningTask } from "@/types/planning";

type CreateTaskInput = {
  title: string;
  category: string;
  estimatedMinutes: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline: string;
  preferredStart?: string;
};

function asPlanningTask(task: {
  id: string; title: string; category: string; estimatedMinutes: number; predictedMinutes: number;
  priority: Priority; deadline: Date; scheduledStart: Date | null; scheduledEnd: Date | null;
  status: TaskStatus; actualMinutes: number | null; interruptionCount: number; createdAt: Date; completedAt: Date | null;
}): PlanningTask {
  return { ...task, priority: task.priority, status: task.status };
}

function requiredTaskId(taskId: string) {
  if (!taskId || typeof taskId !== "string") throw new Error("A task id is required.");
  return taskId;
}

function validMinutes(value: number) {
  if (!Number.isFinite(value) || value < 1 || value > 1_440) throw new Error("Minutes must be between 1 and 1440.");
  return Math.round(value);
}

function preferredTime(deadline: Date, time?: string) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [hour, minute] = time.split(":").map(Number);
  if (hour > 23 || minute > 59) return undefined;
  const start = new Date(deadline);
  start.setHours(hour, minute, 0, 0);
  return start;
}

async function rebuildPendingSchedule() {
  const tasks = await db.task.findMany({ orderBy: { createdAt: "asc" } });
  const schedule = buildSchedule(tasks.map(asPlanningTask));
  const updates = schedule.tasks
    .filter((task) => task.status === "PENDING")
    .map((task) => db.task.update({ where: { id: task.id }, data: { scheduledStart: task.scheduledStart, scheduledEnd: task.scheduledEnd } }));
  await db.$transaction(updates);
}

function refresh() {
  revalidatePath("/");
}

export async function createTask(input: CreateTaskInput) {
  const title = input.title?.trim();
  const category = input.category?.trim();
  const deadline = new Date(input.deadline);
  if (!title || !category || Number.isNaN(deadline.getTime())) throw new Error("Add a title, category, and valid deadline.");

  const estimatedMinutes = validMinutes(input.estimatedMinutes);
  const history = await db.taskHistory.findMany();
  const prediction = predictDuration(
    { category, estimatedMinutes, scheduledStart: preferredTime(deadline, input.preferredStart) },
    history,
  );

  await db.task.create({
    data: {
      title,
      category,
      estimatedMinutes,
      predictedMinutes: prediction.predictedMinutes,
      priority: input.priority as Priority,
      deadline,
      interruptionCount: 0,
    },
  });
  await rebuildPendingSchedule();
  refresh();
}

export async function deleteTask(taskId: string) {
  await db.task.delete({ where: { id: requiredTaskId(taskId) } });
  await rebuildPendingSchedule();
  refresh();
}

export async function completeTask(taskId: string, actualMinutes: number) {
  const task = await db.task.findUnique({ where: { id: requiredTaskId(taskId) } });
  if (!task || task.status === TaskStatus.COMPLETED) return;

  const completedAt = new Date();
  await db.$transaction([
    db.taskHistory.create({
      data: {
        title: task.title,
        category: task.category,
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: validMinutes(actualMinutes),
        startHour: (task.scheduledStart ?? completedAt).getHours(),
        interruptionCount: task.interruptionCount,
        completedAt,
      },
    }),
    db.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.COMPLETED, actualMinutes: validMinutes(actualMinutes), completedAt },
    }),
  ]);
  await rebuildPendingSchedule();
  refresh();
}

/** Adds an observed 35-minute overrun and only moves the active/later pending tasks. */
export async function simulateDelay(taskId: string) {
  const id = requiredTaskId(taskId);
  const tasks = await db.task.findMany({ orderBy: { createdAt: "asc" } });
  const task = tasks.find((entry) => entry.id === id);
  if (!task || task.status === TaskStatus.COMPLETED) return;

  const planned = buildSchedule(tasks.map(asPlanningTask)).tasks;
  const shifted = shiftScheduleAfterDelay(planned, id, 35);
  const updates = shifted
    .filter((entry) => entry.status === "PENDING")
    .map((entry) => db.task.update({
      where: { id: entry.id },
      data: {
        scheduledStart: entry.scheduledStart,
        scheduledEnd: entry.scheduledEnd,
        ...(entry.id === id ? { predictedMinutes: { increment: 35 } } : {}),
      },
    }));
  await db.$transaction(updates);
  refresh();
}

export async function resetDemo() {
  const demo = getDemoData();
  await db.$transaction([
    db.taskHistory.deleteMany(),
    db.task.deleteMany(),
    db.taskHistory.createMany({ data: demo.history }),
    db.task.createMany({ data: demo.tasks }),
  ]);
  refresh();
}
