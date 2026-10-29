import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Search, SlidersHorizontal, ToggleLeft, ToggleRight } from "lucide-react";

import { SeverityBadge } from "../components/Badge";
import { EmptyState, LoadingState } from "../components/State";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/Toast";
import { createRule, fetchRules, toggleRule } from "../services/api";
import type { DetectionRule, Page, Severity } from "../types";

export function RulesPage() {
  const [data, setData] = useState<Page<DetectionRule> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { can } = useAuth();
  const { notify } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    fetchRules({ q: query, page_size: 100 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function onToggle(rule: DetectionRule) {
    await toggleRule(rule.id, !rule.enabled);
    notify(`Rule ${!rule.enabled ? "enabled" : "disabled"}`, "success");
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Rules Listing Panel */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white shadow-inner placeholder:text-zinc-500"
                placeholder="Search detection rules..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <LoadingState label="Loading detection rules" />
          ) : data && data.items.length ? (
            <RuleList rules={data.items} canEdit={can("admin")} onToggle={onToggle} />
          ) : (
            <EmptyState title="No rules found" />
          )}
        </section>

        {/* Custom Rule Authoring Panel */}
        {can("admin") ? <CustomRuleForm onCreated={load} /> : null}
      </div>
    </div>
  );
}

function RuleList({ rules, canEdit, onToggle }: { rules: DetectionRule[]; canEdit: boolean; onToggle: (rule: DetectionRule) => void }) {
  return (
    <div className="mt-4 divide-y divide-white/5">
      {rules.map((rule) => (
        <article key={rule.id} className="py-4 px-2 transition-colors hover:bg-white/[0.03] rounded-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-sm font-bold tracking-tight text-white">{rule.name}</h2>
                <SeverityBadge value={rule.severity} />
              </div>
              <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{rule.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-300 shadow-clay-pill">
                  Threshold: {rule.threshold} hits
                </span>
                <span className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-purple-300 shadow-clay-pill">
                  Window: {rule.time_window_minutes} mins
                </span>
              </div>
            </div>
            <button
              className={`clay-button flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                rule.enabled ? "text-emerald-300 border-emerald-400/30" : "text-zinc-500 border-white/5"
              }`}
              disabled={!canEdit}
              onClick={() => onToggle(rule)}
            >
              {rule.enabled ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-zinc-500" />}
              {rule.enabled ? "Active" : "Disabled"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function CustomRuleForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const { notify } = useToast();
  const [form, setForm] = useState({ name: "", description: "", severity: "medium" as Severity, eventType: "failed_login", threshold: 3, window: 10 });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createRule({
      name: form.name,
      description: form.description,
      severity: form.severity,
      enabled: true,
      threshold: form.threshold,
      time_window_minutes: form.window,
      conditions_json: { type: "threshold", filters: { event_type: form.eventType }, group_by: ["source_ip"] },
    });
    notify("Custom rule deployed to Spectre engine", "success");
    setForm({ name: "", description: "", severity: "medium", eventType: "failed_login", threshold: 3, window: 10 });
    await onCreated();
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/20 text-purple-300 shadow-clay-pill">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Deploy Custom Rule</h2>
          <p className="text-xs text-zinc-400">Configure new behavioral detection triggers</p>
        </div>
      </div>

      <div className="space-y-3.5">
        <Input label="Rule Title" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
        <Input label="Description / Attack Context" value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
        <Input label="Target Event Signature (e.g. failed_login)" value={form.eventType} onChange={(eventType) => setForm((current) => ({ ...current, eventType }))} />
        
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Severity Level</span>
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

        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Trigger Threshold" value={form.threshold} onChange={(threshold) => setForm((current) => ({ ...current, threshold }))} />
          <NumberInput label="Time Window (Mins)" value={form.window} onChange={(window) => setForm((current) => ({ ...current, window }))} />
        </div>

        <button className="clay-button mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-cyan-500/30 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-clay-btn hover:from-purple-500/40 hover:to-cyan-500/40">
          <Plus className="h-4 w-4" />
          Deploy Rule
        </button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      required
      className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
      placeholder={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
      <input
        required
        min={1}
        className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2 px-3 text-sm text-white shadow-inner"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
