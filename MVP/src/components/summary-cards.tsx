import type { TaskView } from "./dashboard-types";

interface SummaryCardsProps {
  tasks: TaskView[];
}

const cardData = (tasks: TaskView[]) => {
  const pending = tasks.filter((task) => task.status === "PENDING");
  const estimated = pending.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const predicted = pending.reduce((sum, task) => sum + task.predictedMinutes, 0);

  return [
    { label: "Pending tasks", value: pending.length, detail: "in today’s plan", tone: "cyan", icon: "◌" },
    { label: "Original estimate", value: `${estimated}m`, detail: "your first estimate", tone: "slate", icon: "◷" },
    { label: "Predicted workload", value: `${predicted}m`, detail: "adaptive duration", tone: "green", icon: "◴" },
    { label: "Extra time detected", value: `+${Math.max(0, predicted - estimated)}m`, detail: "based on your history", tone: "amber", icon: "↗" },
  ];
};

const toneClasses: Record<string, string> = {
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  slate: "border-slate-500/30 bg-slate-700/40 text-slate-200",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-100",
};

export function SummaryCards({ tasks }: SummaryCardsProps) {
  return (
    <section aria-label="Today at a glance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cardData(tasks).map((card) => (
        <article key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
            <span className={`grid h-8 w-8 place-items-center rounded-xl border text-lg ${toneClasses[card.tone]}`}>{card.icon}</span>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{card.value}</p>
          <p className="mt-1 text-xs text-slate-400">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
