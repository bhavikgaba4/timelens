"use client";

import { useTransition } from "react";
import { AnalyticsPanel } from "./analytics-panel";
import type { AnalyticsView, DashboardActions, TaskView } from "./dashboard-types";
import { DailyTimeline } from "./daily-timeline";
import { PredictionPanel } from "./prediction-panel";
import { SummaryCards } from "./summary-cards";
import { TaskForm } from "./task-form";

interface TimeLensDashboardProps extends DashboardActions { tasks: TaskView[]; analytics: AnalyticsView; }

export function TimeLensDashboard({ tasks, analytics, onResetDemo, ...actions }: TimeLensDashboardProps) {
  const [isResetting, startTransition] = useTransition();
  return <main className="min-h-screen bg-[#07111f] text-slate-100 selection:bg-cyan-300 selection:text-slate-950"><div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-24 -top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" /><div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" /></div><div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><header className="mb-7 flex flex-col gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950 shadow-lg shadow-cyan-400/20">T</div><div><h1 className="text-xl font-semibold tracking-tight text-white">TimeLens <span className="text-cyan-300">AI</span></h1><p className="text-xs text-slate-400">Adaptive task-duration planner</p></div></div><button onClick={() => startTransition(async () => { await onResetDemo?.(); })} disabled={isResetting} className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-100 disabled:opacity-50">{isResetting ? "Restoring demo…" : "↻  Reset demo"}</button></header><SummaryCards tasks={tasks} /><div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)]"><div className="space-y-6"><TaskForm onCreateTask={actions.onCreateTask} /><DailyTimeline tasks={tasks} {...actions} /></div><aside className="space-y-6"><PredictionPanel tasks={tasks} /><AnalyticsPanel analytics={analytics} /><div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4"><p className="text-xs font-semibold text-amber-100">Demo prompt</p><p className="mt-1 text-xs leading-5 text-slate-300">Try <b>+35m delay</b> on a planned task. TimeLens immediately rebuilds the remaining timeline while keeping completed work fixed.</p></div></aside></div></div></main>;
}
