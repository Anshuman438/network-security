import clsx from "clsx";

import { severityClass, statusClass } from "../utils/format";

export function SeverityBadge({ value }: { value?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] uppercase font-bold tracking-wider", severityClass(value))}>
      {value ?? "unknown"}
    </span>
  );
}

export function StatusBadge({ value }: { value?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] uppercase font-bold tracking-wider", statusClass(value))}>
      {value?.replace("_", " ") ?? "unknown"}
    </span>
  );
}
