import clsx from "clsx";

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function shortNumber(value: number) {
  return new Intl.NumberFormat(undefined, { notation: value > 9999 ? "compact" : "standard" }).format(value);
}

export function severityClass(severity?: string) {
  return clsx(
    "border shadow-clay-pill font-semibold tracking-wide backdrop-blur-md",
    severity === "critical" && "border-rose-400/50 bg-gradient-to-r from-rose-500/25 to-red-600/30 text-rose-200",
    severity === "high" && "border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-orange-600/30 text-amber-200",
    severity === "medium" && "border-sky-400/50 bg-gradient-to-r from-sky-500/25 to-blue-600/30 text-sky-200",
    severity === "low" && "border-emerald-400/50 bg-gradient-to-r from-emerald-500/25 to-teal-600/30 text-emerald-200",
    !severity && "border-zinc-500/40 bg-zinc-800/40 text-zinc-300",
  );
}

export function statusClass(status?: string) {
  return clsx(
    "border shadow-clay-pill font-semibold tracking-wide backdrop-blur-md",
    status === "open" && "border-rose-400/50 bg-rose-500/20 text-rose-200",
    status === "investigating" && "border-purple-400/50 bg-purple-500/20 text-purple-200",
    status === "resolved" && "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
    status === "false_positive" && "border-zinc-500/40 bg-zinc-800/40 text-zinc-300",
    !status && "border-zinc-500/40 bg-zinc-800/40 text-zinc-300",
  );
}
