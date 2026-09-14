"use client";

import { FormEvent, useState, useTransition } from "react";
import type { NewTaskInput, Priority } from "./dashboard-types";

const categories = ["Technical Report", "Coding", "Revision", "Administration"];

interface TaskFormProps {
  onCreateTask?: (input: NewTaskInput) => Promise<void> | void;
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15";

export function TaskForm({ onCreateTask }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [preferredStart, setPreferredStart] = useState("14:00");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minutes = Number(estimatedMinutes);
    if (!title.trim() || !Number.isFinite(minutes) || minutes <= 0 || !deadline) {
      setError("Add a title, positive estimate, and deadline to continue.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await onCreateTask?.({ title: title.trim(), category, estimatedMinutes: Math.round(minutes), priority, deadline, preferredStart: preferredStart || undefined });
        setTitle("");
        setEstimatedMinutes("60");
      } catch {
        setError("The task could not be saved. Please try again.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">+</span>
        <div>
          <h2 className="font-semibold text-white">Plan a task</h2>
          <p className="text-xs text-slate-400">Your estimate is corrected using completed work.</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="text-xs font-medium text-slate-300">Task title</span><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Write results section" /></label>
        <label><span className="text-xs font-medium text-slate-300">Category</span><select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="text-xs font-medium text-slate-300">Your estimate (min)</span><input className={inputClass} type="number" min="1" value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} /></label>
        <label><span className="text-xs font-medium text-slate-300">Priority</span><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
        <label><span className="text-xs font-medium text-slate-300">Deadline</span><input className={inputClass} type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
        <label><span className="text-xs font-medium text-slate-300">Preferred start <em className="not-italic text-slate-500">optional</em></span><input className={inputClass} type="time" value={preferredStart} onChange={(event) => setPreferredStart(event.target.value)} /></label>
        <div className="flex items-end"><button disabled={isPending} className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">{isPending ? "Calculating…" : "Add & predict"}</button></div>
        {error && <p role="alert" className="sm:col-span-2 text-xs text-rose-300">{error}</p>}
      </form>
    </section>
  );
}
