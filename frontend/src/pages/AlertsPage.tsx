import { useEffect, useState } from "react";
import { CheckCircle2, FileText, MessageSquarePlus, Search, X } from "lucide-react";

import { SeverityBadge, StatusBadge } from "../components/Badge";
import { EmptyState, LoadingState } from "../components/State";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/Toast";
import { addAlertNote, fetchAlert, fetchAlerts, updateAlertStatus } from "../services/api";
import type { Alert, AlertDetail, AlertStatus, Page } from "../types";
import { formatDate } from "../utils/format";

export function AlertsPage() {
  const [data, setData] = useState<Page<Alert> | null>(null);
  const [detail, setDetail] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", severity: "", status: "", source_ip: "", username: "" });

  useEffect(() => {
    setLoading(true);
    fetchAlerts({ ...filters, page_size: 30 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters]);

  async function openDetail(alert: Alert) {
    setDetail(await fetchAlert(alert.id));
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.severity || filters.status || filters.source_ip || filters.username
  );

  function resetFilters() {
    setFilters({ q: "", severity: "", status: "", source_ip: "", username: "" });
  }

  return (
    <div className="space-y-5">
      {/* Aligned Claymorphic Filter Bar */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-4 shadow-clay-card backdrop-blur-2xl">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 items-end">
          <SearchFilter
            label="Search"
            placeholder="Search alerts..."
            value={filters.q}
            onChange={(q) => setFilters((current) => ({ ...current, q }))}
          />
          <Select
            label="Severity"
            value={filters.severity}
            onChange={(severity) => setFilters((current) => ({ ...current, severity }))}
            options={["", "critical", "high", "medium", "low"]}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(status) => setFilters((current) => ({ ...current, status }))}
            options={["", "open", "investigating", "resolved", "false_positive"]}
          />
          <Text
            label="Source IP"
            placeholder="Filter Source IP"
            value={filters.source_ip}
            onChange={(source_ip) => setFilters((current) => ({ ...current, source_ip }))}
          />
          <Text
            label="Target User"
            placeholder="Filter Username"
            value={filters.username}
            onChange={(username) => setFilters((current) => ({ ...current, username }))}
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-zinc-400">
            <span>Filtering active alerts</span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition underline underline-offset-2"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading alerts" />
      ) : data && data.items.length > 0 ? (
        <AlertsTable alerts={data.items} onSelect={openDetail} />
      ) : (
        <EmptyState title="No alerts found" />
      )}

      {detail ? <AlertDrawer detail={detail} onClose={() => setDetail(null)} onRefresh={async () => setDetail(await fetchAlert(detail.id))} /> : null}
    </div>
  );
}

function AlertsTable({ alerts, onSelect }: { alerts: Alert[]; onSelect: (alert: Alert) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-clay-card backdrop-blur-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase font-bold text-zinc-300">
            <tr>
              <th className="px-5 py-4">Title</th>
              <th className="px-5 py-4">Severity</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Source IP</th>
              <th className="px-5 py-4">Target User</th>
              <th className="px-5 py-4">Events</th>
              <th className="px-5 py-4">Last Seen</th>
              <th className="px-5 py-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {alerts.map((alert, idx) => (
              <tr
                key={alert.id}
                className={`transition-colors hover:bg-white/10 ${
                  idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                }`}
              >
                <td className="max-w-sm px-5 py-3.5 font-medium text-white">{alert.title}</td>
                <td className="px-5 py-3.5">
                  <SeverityBadge value={alert.severity} />
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge value={alert.status} />
                </td>
                <td className="px-5 py-3.5 font-mono text-xs">
                  {alert.source_ip ? (
                    <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-300 shadow-clay-pill">
                      {alert.source_ip}
                    </span>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {alert.affected_user ? (
                    <span className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-purple-300 shadow-clay-pill">
                      {alert.affected_user}
                    </span>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300 shadow-clay-pill">
                    {alert.event_count}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-zinc-300">{formatDate(alert.last_seen)}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    className="clay-button p-2 text-zinc-200 hover:text-white"
                    onClick={() => onSelect(alert)}
                    title="View Investigation Details"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertDrawer({ detail, onClose, onRefresh }: { detail: AlertDetail; onClose: () => void; onRefresh: () => Promise<void> }) {
  const { can } = useAuth();
  const { notify } = useToast();
  const [note, setNote] = useState("");
  const canInvestigate = can("admin", "analyst");

  async function changeStatus(status: AlertStatus) {
    await updateAlertStatus(detail.id, status);
    notify("Alert status updated", "success");
    await onRefresh();
  }

  async function submitNote() {
    if (!note.trim()) return;
    await addAlertNote(detail.id, note);
    setNote("");
    notify("Note added", "success");
    await onRefresh();
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">{detail.title}</h2>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge value={detail.severity} />
              <StatusBadge value={detail.status} />
            </div>
          </div>
          <button className="clay-button p-2 text-zinc-400 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200 shadow-clay-pill">{detail.description}</p>

          {canInvestigate ? (
            <div className="flex flex-wrap gap-2">
              {(["open", "investigating", "resolved", "false_positive"] as AlertStatus[]).map((status) => (
                <button
                  key={status}
                  className="clay-button px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-200 hover:text-white"
                  onClick={() => changeStatus(status)}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          ) : null}

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              Event Timeline
            </h3>
            <div className="space-y-3">
              {detail.related_events.slice(0, 12).map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-clay-card">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                    <span className="text-cyan-300">{formatDate(event.timestamp)}</span>
                    <span>•</span>
                    <span className="text-purple-300">{event.source_ip ?? "-"}</span>
                    <span>•</span>
                    <SeverityBadge value={event.severity} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{event.message}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <MessageSquarePlus className="h-4 w-4 text-purple-400" />
              Analyst Investigation Notes
            </h3>
            <div className="space-y-3">
              {detail.notes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-clay-card">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-300">{item.user?.username ?? "Analyst"}</span>
                    <span className="font-mono text-zinc-400">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{item.note}</p>
                </div>
              ))}
            </div>

            {canInvestigate ? (
              <div className="mt-4 space-y-3">
                <textarea
                  className="w-full rounded-2xl border border-white/10 bg-black/40 p-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  rows={3}
                  placeholder="Record an investigation finding or analyst note..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <button
                  className="clay-button rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={submitNote}
                >
                  Save Note
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}

function SearchFilter({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
      <span className="mb-1.5 block">{label}</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          className="focus-ring h-10 w-full rounded-xl border border-white/10 bg-zinc-900/80 py-2 pl-10 pr-3 text-xs text-white placeholder:text-zinc-500 shadow-inner transition focus:border-purple-400/50"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
      <span className="mb-1.5 block">{label}</span>
      <select
        className="focus-ring h-10 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 text-xs text-white shadow-clay-pill transition focus:border-purple-400/50 cursor-pointer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-zinc-900 text-white">
            {option
              ? option.replace("_", " ")
              : label === "Severity"
              ? "All Severities"
              : `All ${label}s`}
          </option>
        ))}
      </select>
    </label>
  );
}

function Text({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
      <span className="mb-1.5 block">{label}</span>
      <input
        className="focus-ring h-10 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 text-xs text-white placeholder:text-zinc-500 shadow-inner transition focus:border-purple-400/50"
        placeholder={placeholder ?? `Filter ${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
