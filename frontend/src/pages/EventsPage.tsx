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
  const [selected, setSelected] = useState<NormalizedEvent | null>(null);
  const [filters, setFilters] = useState({ q: "", severity: "", event_type: "", source_ip: "", username: "", hostname: "" });

  useEffect(() => {
    setLoading(true);
    fetchEvents({ ...filters, page_size: 30 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="space-y-5">
      {/* Claymorphic Filter Panel */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
        <div className="grid gap-3 md:grid-cols-[minmax(180px,1.5fr)_repeat(5,minmax(120px,1fr))]">
          <label className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white shadow-inner placeholder:text-zinc-500"
              placeholder="Search raw logs..."
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </label>
          <FilterInput label="Severity" value={filters.severity} onChange={(value) => setFilters((current) => ({ ...current, severity: value }))} options={["", "critical", "high", "medium", "low"]} />
          <FilterInput label="Type" value={filters.event_type} onChange={(value) => setFilters((current) => ({ ...current, event_type: value }))} options={["", "failed_login", "successful_login", "web_request", "http_404", "firewall_denied"]} />
          <TextFilter label="Source IP" value={filters.source_ip} onChange={(value) => setFilters((current) => ({ ...current, source_ip: value }))} />
          <TextFilter label="Username" value={filters.username} onChange={(value) => setFilters((current) => ({ ...current, username: value }))} />
          <TextFilter label="Hostname" value={filters.hostname} onChange={(value) => setFilters((current) => ({ ...current, hostname: value }))} />
        </div>
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

function FilterInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
      <span className="mb-1 block">{label}</span>
      <select
        className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-2.5 px-3 text-sm text-white shadow-clay-pill focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-zinc-900 text-white">
            {option ? option.replace("_", " ") : `All ${label}s`}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
      <span className="mb-1 block">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3 text-sm text-white shadow-inner placeholder:text-zinc-500 focus:outline-none"
        placeholder={`Filter ${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
