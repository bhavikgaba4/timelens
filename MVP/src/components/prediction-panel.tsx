import type { TaskView } from "./dashboard-types";

interface PredictionPanelProps { tasks: TaskView[]; }

const confidenceTone = { LOW: "bg-slate-700 text-slate-200", MEDIUM: "bg-amber-400/15 text-amber-100", HIGH: "bg-emerald-400/15 text-emerald-100" };

export function PredictionPanel({ tasks }: PredictionPanelProps) {
  // New work is the most useful thing to explain after the Add & predict action.
  const selected = tasks
    .filter((task) => task.status === "PENDING" && task.prediction)
    .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())[0]
    ?? tasks.find((task) => task.prediction);
  if (!selected?.prediction) return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="font-semibold text-white">Prediction insight</h2><p className="mt-3 text-sm text-slate-400">Add a task to see its explainable duration prediction.</p></section>;
  const prediction = selected.prediction;
  const factors = [["Category pattern", `${prediction.categoryBiasFactor.toFixed(2)}×`], ["Time of day", `${prediction.timeOfDayFactor.toFixed(2)}×`], ["Interruptions", `+${prediction.interruptionOverhead}m`]];
  return <section className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.09] to-slate-900/80 p-5 shadow-xl shadow-slate-950/20"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Prediction insight</p><h2 className="mt-1 font-semibold text-white">{selected.title}</h2></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${confidenceTone[prediction.confidence]}`}>{prediction.confidence} confidence</span></div><div className="mt-5 flex items-end gap-3"><span className="text-4xl font-semibold tracking-tight text-cyan-200">{selected.predictedMinutes}m</span><span className="mb-1 text-sm text-slate-400">from {selected.estimatedMinutes}m estimated</span></div><p className="mt-4 text-sm leading-6 text-slate-200">{prediction.explanation}</p><dl className="mt-5 grid grid-cols-3 gap-2">{factors.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-700/70 bg-slate-950/35 p-2.5"><dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{value}</dd></div>)}</dl></section>;
}
