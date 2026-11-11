import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";

import { SeverityBadge } from "../components/Badge";
import { EmptyState, LoadingState } from "../components/State";
import { fetchEvents } from "../services/api";
import type { NormalizedEvent, Page } from "../types";
import { formatDate } from "../utils/format";

export function EventsPage() {
  const [data, setData] = useState<Page<NormalizedEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveStreaming, setLiveStreaming] = useState(true);
  const [selected, setSelected] = useState<NormalizedEvent | null>(null);
  const [filters, setFilters] = useState({ q: "", severity: "", event_type: "", source_ip: "", username: "", hostname: "" });

  const hasActiveFilters = Boolean(
    filters.q || filters.severity || filters.event_type || filters.source_ip || filters.username || filters.hostname
  );

  useEffect(() => {
    setLoading(true);
    fetchEvents({ ...filters, page_size: 30 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters]);

  // Live polling: automatically fetch newest events when not actively filtering
  useEffect(() => {
    if (!liveStreaming || hasActiveFilters) return;
    const interval = setInterval(() => {
      fetchEvents({ page_size: 30 })
        .then((fresh) => {
          setData(fresh);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [liveStreaming, hasActiveFilters]);

  function resetFilters() {
    setFilters({ q: "", severity: "", event_type: "", source_ip: "", username: "", hostname: "" });
  }

  return (
    <div className="space-y-5">
      {/* Aligned Claymorphic Filter Bar */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-4 shadow-clay-card backdrop-blur-2xl">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 items-end">
          <SearchFilter
            label="Search"
            placeholder="Search raw logs..."
            value={filters.q}
            onChange={(q) => setFilters((current) => ({ ...current, q }))}
          />
          <FilterInput
            label="Severity"
            value={filters.severity}
            onChange={(severity) => setFilters((current) => ({ ...current, severity }))}
            options={["", "critical", "high", "medium", "low"]}
          />
          <FilterInput
            label="Type"
            value={filters.event_type}
            onChange={(event_type) => setFilters((current) => ({ ...current, event_type }))}
            options={["", "failed_login", "successful_login", "web_request", "http_404", "firewall_denied"]}
          />
          <TextFilter
            label="Source IP"
            placeholder="Filter Source IP"
            value={filters.source_ip}
            onChange={(source_ip) => setFilters((current) => ({ ...current, source_ip }))}
          />
          <TextFilter
            label="Username"
            placeholder="Filter Username"
            value={filters.username}
            onChange={(username) => setFilters((current) => ({ ...current, username }))}
          />
          <TextFilter
            label="Hostname"
            placeholder="Filter Hostname"
            value={filters.hostname}
            onChange={(hostname) => setFilters((current) => ({ ...current, hostname }))}
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-zinc-400">
            <span>Filtering active events</span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition underline underline-offset-2"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Live Stream Status & Event Count Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveStreaming(!liveStreaming)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-clay-pill ${
              liveStreaming
                ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${liveStreaming ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
            {liveStreaming ? "LIVE STREAM ACTIVE (4s)" : "STREAM PAUSED"}
          </button>
          {hasActiveFilters && (
            <span className="text-[11px] text-amber-300/80 font-mono">
              (Live stream paused during filtering)
            </span>
          )}
        </div>
        {data?.total !== undefined && (
          <span className="text-xs text-zinc-400 font-mono">
            Total Indexed: <strong className="text-white">{data.total.toLocaleString()}</strong> events
          </span>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading normalized events" />
      ) : data && data.items.length > 0 ? (
        <EventsTable events={data.items} onSelect={setSelected} />
      ) : (
        <EmptyState title="No events found" />
      )}

      {selected ? <EventDrawer event={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function EventsTable({ events, onSelect }: { events: NormalizedEvent[]; onSelect: (event: NormalizedEvent) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-clay-card backdrop-blur-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase font-bold text-zinc-300">
            <tr>
              <th className="px-5 py-4">Timestamp</th>
              <th className="px-5 py-4">Event Type</th>
              <th className="px-5 py-4">Severity</th>
              <th className="px-5 py-4">Source IP</th>
              <th className="px-5 py-4">Identity</th>
              <th className="px-5 py-4">Host</th>
              <th className="px-5 py-4">Raw Payload Message</th>
              <th className="px-5 py-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {events.map((event, idx) => (
              <tr
                key={event.id}
                className={`transition-colors hover:bg-white/10 ${
                  idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                }`}
              >
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-cyan-300">{formatDate(event.timestamp)}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-300 shadow-clay-pill">
                    {event.event_type}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <SeverityBadge value={event.severity} />
                </td>
                <td className="px-5 py-3.5 font-mono text-xs">
                  {event.source_ip ? (
                    <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-300 shadow-clay-pill">
                      {event.source_ip}
                    </span>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {event.username ? (
                    <span className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-purple-300 shadow-clay-pill">
                      {event.username}
                    </span>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs text-zinc-300">{event.hostname ?? "-"}</span>
                </td>
                <td className="max-w-sm truncate px-5 py-3.5 text-xs text-zinc-300">{event.message}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    className="clay-button p-2 text-zinc-200 hover:text-white"
                    onClick={() => onSelect(event)}
                    title="Inspect normalized event"
                  >
                    <Eye className="h-4 w-4" />
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

function EventDrawer({ event, onClose }: { event: NormalizedEvent; onClose: () => void }) {
  const fields = Object.entries(event).filter(([key]) => !["raw_log", "message"].includes(key));
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-white">Event #{event.id}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-xs text-purple-300">{event.event_type}</span>
              <SeverityBadge value={event.severity} />
            </div>
          </div>
          <button className="clay-button p-2 text-zinc-400 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-clay-pill">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Message</h3>
            <p className="font-mono text-xs text-zinc-200">{event.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fields.map(([key, val]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-clay-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{key.replace("_", " ")}</span>
                <p className="mt-1 font-mono text-xs text-white">{String(val ?? "-")}</p>
              </div>
            ))}
          </div>

          {event.raw_log ? (
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-inner">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-300">Raw Syslog Packet</h3>
              <pre className="overflow-x-auto font-mono text-xs text-zinc-300 whitespace-pre-wrap">{event.raw_log}</pre>
            </div>
          ) : null}
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

function FilterInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
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

function TextFilter({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (value: string) => void }) {
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
