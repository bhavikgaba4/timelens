"use client";

import { useState, useTransition } from "react";
import type { DashboardActions, Priority, TaskView } from "./dashboard-types";

interface DailyTimelineProps extends Pick<DashboardActions, "onCompleteTask" | "onDeleteTask" | "onSimulateDelay"> {
  tasks: TaskView[];
}

const priorityTone: Record<Priority, string> = {
  HIGH: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  MEDIUM: "border-amber-400/25 bg-amber-400/10 text-amber-100",
  LOW: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
};

function date(value?: string | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", ...options }).format(new Date(value));
}

function deadline(value: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function TaskRow({ task, onCompleteTask, onDeleteTask, onSimulateDelay }: { task: TaskView } & Pick<DashboardActions, "onCompleteTask" | "onDeleteTask" | "onSimulateDelay">) {
  const [actual, setActual] = useState(String(task.actualMinutes ?? task.predictedMinutes));
  const [isPending, startTransition] = useTransition();
  const act = (callback?: () => Promise<void> | void) => startTransition(async () => { await callback?.(); });
  const completed = task.status === "COMPLETED";

  return (
    <li className={`group relative grid gap-3 border-b border-slate-800 px-4 py-4 last:border-0 sm:grid-cols-[78px_minmax(0,1fr)_auto] sm:items-center sm:px-5 ${completed ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 sm:block">
        <span className="block text-sm text-cyan-100">{date(task.scheduledStart)}</span>
        <span>to {date(task.scheduledEnd)}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`truncate font-medium ${completed ? "text-slate-400 line-through" : "text-white"}`}>{task.title}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityTone[task.priority]}`}>{task.priority}</span>
          {task.deadlineRisk && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">Deadline risk</span>}
          {completed && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">Completed</span>}
        </div>
        <p className="mt-1 text-xs text-slate-400">{task.category} <span className="px-1 text-slate-600">·</span> estimate <b className="font-medium text-slate-300">{task.estimatedMinutes}m</b> <span className="px-1 text-slate-600">→</span> predicted <b className="font-medium text-cyan-200">{task.predictedMinutes}m</b> <span className="px-1 text-slate-600">·</span> due {deadline(task.deadline)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {!completed && <><input aria-label={`Actual minutes for ${task.title}`} className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-xs text-white outline-none focus:border-cyan-400" type="number" min="1" value={actual} onChange={(event) => setActual(event.target.value)} /><button disabled={isPending} onClick={() => act(() => onCompleteTask?.(task.id, Number(actual)))} className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-400/20">Complete</button><button disabled={isPending} onClick={() => act(() => onSimulateDelay?.(task.id))} className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-400/20">+35m delay</button></>}
        <button aria-label={`Delete ${task.title}`} disabled={isPending} onClick={() => act(() => onDeleteTask?.(task.id))} className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-rose-400/10 hover:text-rose-300">×</button>
      </div>
    </li>
  );
}

export function DailyTimeline({ tasks, ...actions }: DailyTimelineProps) {
  const pending = tasks.filter((task) => task.status === "PENDING");
  const completed = tasks.filter((task) => task.status === "COMPLETED");
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div><h2 className="font-semibold text-white">Today’s timeline</h2><p className="mt-0.5 text-xs text-slate-400">Starting at 9:00 AM · predicted durations</p></div>
        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">{pending.length} planned</span>
      </div>
      {tasks.length === 0 ? <div className="px-5 py-12 text-center text-sm text-slate-400">Your timeline is clear. Add a task to begin planning.</div> : <ul>{pending.map((task) => <TaskRow key={task.id} task={task} {...actions} />)}{completed.length > 0 && <li className="border-y border-slate-800 bg-slate-950/30 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Done today</li>}{completed.map((task) => <TaskRow key={task.id} task={task} {...actions} />)}</ul>}
    </section>
  );
}
