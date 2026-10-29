import type { LucideIcon } from "lucide-react";

import { shortNumber } from "../utils/format";

export function MetricCard({
  title,
  value,
  icon: Icon,
  tone = "cyan",
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  tone?: "cyan" | "emerald" | "amber" | "red";
}) {
  const tones = {
    cyan: {
      bg: "bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.25),inset_-1px_-1px_3px_rgba(0,0,0,0.5)]",
      glow: "from-cyan-500/10 to-blue-600/5",
    },
    emerald: {
      bg: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.25),inset_-1px_-1px_3px_rgba(0,0,0,0.5)]",
      glow: "from-emerald-500/10 to-teal-600/5",
    },
    amber: {
      bg: "bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.25),inset_-1px_-1px_3px_rgba(0,0,0,0.5)]",
      glow: "from-amber-500/10 to-orange-600/5",
    },
    red: {
      bg: "bg-rose-500/15 border-rose-400/40 text-rose-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.25),inset_-1px_-1px_3px_rgba(0,0,0,0.5)]",
      glow: "from-rose-500/10 to-red-600/5",
    },
  };

  const currentTone = tones[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${currentTone.glow} backdrop-blur-2xl p-5 shadow-clay-card transition duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">{shortNumber(value)}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${currentTone.bg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
