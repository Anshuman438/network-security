import { useState } from "react";
import { Download, FileJson, FileText, UploadCloud, ShieldAlert } from "lucide-react";

import { SeverityBadge } from "../components/Badge";
import { EmptyState } from "../components/State";
import { useToast } from "../components/Toast";
import { uploadLogs } from "../services/api";
import type { IngestResponse } from "../types";

const samples = [
  { label: "SSH Authentication Log", href: "/sample_logs/ssh_auth.log" },
  { label: "Web Access Log (Apache/Nginx)", href: "/sample_logs/web_access.log" },
  { label: "Network Firewall Log", href: "/sample_logs/firewall.log" },
  { label: "Application JSONL Logins", href: "/sample_logs/application_logins.jsonl" },
];

export function UploadLogsPage() {
  const { notify } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const response = await uploadLogs(file, setProgress);
      setResult(response);
      notify(`Parsed ${response.parsed_count} events and triggered ${response.alert_count} alerts`, "success");
    } catch {
      notify("Log ingest failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* Upload Zone & Preview */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
        <label className="flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-black/30 p-6 text-center transition hover:border-purple-400/50 hover:bg-white/[0.03] shadow-inner">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/40 bg-purple-500/20 text-purple-300 shadow-clay-pill mb-3">
            <UploadCloud className="h-7 w-7" />
          </div>
          <span className="text-sm font-bold text-white">{file ? file.name : "Select or Drop Raw Syslog File"}</span>
          <span className="mt-1 text-xs text-zinc-400">Supported formats: JSON, JSONL, CSV, TXT, LOG (Max: 2 MB)</span>
          <input className="hidden" type="file" accept=".json,.csv,.txt,.log" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="clay-button flex items-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-cyan-500/30 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-clay-btn hover:from-purple-500/40 hover:to-cyan-500/40 disabled:opacity-40"
            disabled={!file || loading}
            onClick={submit}
          >
            <UploadCloud className="h-4 w-4" />
            {loading ? "Ingesting Telemetry..." : "Ingest & Parse Logs"}
          </button>
          <div className="h-3 min-w-48 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/40 p-0.5 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Parsed Preview Table */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Parsed Events Live Preview</h2>
            {result && (
              <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300 shadow-clay-pill">
                {result.parsed_count} Events Normalized
              </span>
            )}
          </div>
          {result?.preview.length ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-inner">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase font-bold text-zinc-300">
                  <tr>
                    <th className="px-4 py-3">Event Signature</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Source IP</th>
                    <th className="px-4 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-200">
                  {result.preview.map((event, idx) => (
                    <tr key={event.id} className={idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-purple-300">{event.event_type}</td>
                      <td className="px-4 py-3">
                        <SeverityBadge value={event.severity} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-cyan-300">{event.source_ip ?? "-"}</td>
                      <td className="max-w-md truncate px-4 py-3 font-mono text-xs text-zinc-300">{event.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No parsed events yet. Upload a log file above to test ingestion." />
          )}
        </div>
      </section>

      {/* Sidebar: Sample Datasets */}
      <aside className="space-y-5">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            <Download className="h-4 w-4 text-emerald-300" />
            Download Sample Test Datasets
          </h2>
          <div className="space-y-2.5">
            {samples.map((sample) => (
              <a
                key={sample.href}
                className="clay-button flex items-center justify-between p-3 text-xs font-medium text-zinc-200 hover:text-white"
                href={sample.href}
                download
              >
                <span className="flex items-center gap-2.5">
                  {sample.href.endsWith(".jsonl") ? (
                    <FileJson className="h-4 w-4 text-cyan-300" />
                  ) : (
                    <FileText className="h-4 w-4 text-amber-300" />
                  )}
                  {sample.label}
                </span>
                <Download className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Parser Diagnostics</h2>
          {result?.errors.length ? (
            <div className="max-h-64 space-y-2 overflow-auto">
              {result.errors.map((error, index) => (
                <div key={index} className="rounded-xl border border-rose-400/30 bg-rose-500/15 p-2.5 font-mono text-xs text-rose-200 shadow-clay-pill">
                  {error}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400 shadow-inner">
              Zero syntax or parsing errors. Parser operational.
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
