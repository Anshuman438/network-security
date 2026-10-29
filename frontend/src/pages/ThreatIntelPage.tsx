import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Radar, Search, Trash2 } from "lucide-react";

import { SeverityBadge } from "../components/Badge";
import { EmptyState, LoadingState } from "../components/State";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/Toast";
import { createIndicator, deleteIndicator, fetchIndicators } from "../services/api";
import type { Page, Severity, ThreatIndicator } from "../types";

export function ThreatIntelPage() {
  const [data, setData] = useState<Page<ThreatIndicator> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { can } = useAuth();
  const { notify } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    fetchIndicators({ q: query, page_size: 50 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    await deleteIndicator(id);
    notify("Threat indicator purged", "success");
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* Indicator Feed Table */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
        <div className="border-b border-white/10 pb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white shadow-inner placeholder:text-zinc-500"
              placeholder="Search threat indicators (IPs, domains, malicious actors)..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <LoadingState label="Loading threat intelligence feeds" />
        ) : data && data.items.length ? (
          <IndicatorTable indicators={data.items} canEdit={can("admin")} onDelete={remove} />
        ) : (
          <EmptyState title="No indicators found" />
        )}
      </section>

      {/* Add Indicator Form */}
      {can("admin") ? <IndicatorForm onCreated={load} /> : null}
    </div>
  );
}

function IndicatorTable({ indicators, canEdit, onDelete }: { indicators: ThreatIndicator[]; canEdit: boolean; onDelete: (id: number) => void }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase font-bold text-zinc-300">
          <tr>
            <th className="px-4 py-3.5">Indicator Type</th>
            <th className="px-4 py-3.5">Indicator Value</th>
            <th className="px-4 py-3.5">Severity</th>
            <th className="px-4 py-3.5">Threat Intel Context</th>
            <th className="px-4 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-zinc-200">
          {indicators.map((indicator, idx) => (
            <tr
              key={indicator.id}
              className={`transition-colors hover:bg-white/10 ${
                idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
              }`}
            >
              <td className="px-4 py-3.5 font-bold uppercase text-xs">
                <span
                  className={`rounded-lg border px-2.5 py-1 text-[11px] shadow-clay-pill ${
                    indicator.type === "ip"
                      ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                      : indicator.type === "domain"
                      ? "border-purple-400/40 bg-purple-500/15 text-purple-300"
                      : "border-amber-400/40 bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {indicator.type}
                </span>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs font-semibold text-white">{indicator.value}</td>
              <td className="px-4 py-3.5">
                <SeverityBadge value={indicator.severity} />
              </td>
              <td className="max-w-md px-4 py-3.5 text-xs text-zinc-300">{indicator.description ?? "-"}</td>
              <td className="px-4 py-3.5 text-right">
                <button
                  className="clay-button p-2 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 disabled:opacity-40"
                  disabled={!canEdit}
                  onClick={() => onDelete(indicator.id)}
                  title="Delete indicator"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IndicatorForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const { notify } = useToast();
  const [form, setForm] = useState({ type: "ip" as ThreatIndicator["type"], value: "", description: "", severity: "medium" as Severity });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createIndicator(form);
    notify("Indicator added to blacklist", "success");
    setForm({ type: "ip", value: "", description: "", severity: "medium" });
    await onCreated();
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/20 text-purple-300 shadow-clay-pill">
          <Radar className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Add Threat Indicator</h2>
          <p className="text-xs text-zinc-400">Blocklist IPs, malicious domains, or flagged users</p>
        </div>
      </div>

      <div className="space-y-3.5">
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Type</span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-2.5 px-3.5 text-sm text-white shadow-clay-pill focus:outline-none"
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ThreatIndicator["type"] }))}
          >
            <option value="ip" className="bg-zinc-900">IP Address</option>
            <option value="domain" className="bg-zinc-900">Domain / FQDN</option>
            <option value="username" className="bg-zinc-900">Username / Identity</option>
          </select>
        </div>

        <input
          required
          className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
          placeholder="Indicator value (e.g. 192.168.1.100 or evil.com)"
          value={form.value}
          onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
        />

        <input
          className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
          placeholder="Context / Threat intel source"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />

        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Severity</span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-2.5 px-3.5 text-sm text-white shadow-clay-pill focus:outline-none capitalize"
            value={form.severity}
            onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value as Severity }))}
          >
            {["low", "medium", "high", "critical"].map((severity) => (
              <option key={severity} value={severity} className="bg-zinc-900 capitalize">
                {severity}
              </option>
            ))}
          </select>
        </div>

        <button className="clay-button mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-cyan-500/30 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-clay-btn hover:from-purple-500/40 hover:to-cyan-500/40">
          <Plus className="h-4 w-4" />
          Enforce Indicator
        </button>
      </div>
    </form>
  );
}
