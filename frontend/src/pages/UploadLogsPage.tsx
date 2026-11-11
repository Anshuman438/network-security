import { useState } from "react";
import { Download, FileJson, FileText, Globe, Link2, UploadCloud, ShieldAlert } from "lucide-react";

import { SeverityBadge } from "../components/Badge";
import { EmptyState } from "../components/State";
import { useToast } from "../components/Toast";
import { ingestLogsFromUrl, uploadLogs } from "../services/api";
import type { IngestResponse } from "../types";

const samples = [
  { label: "SSH Authentication Log", href: "/sample_logs/ssh_auth.log" },
  { label: "Web Access Log (Apache/Nginx)", href: "/sample_logs/web_access.log" },
  { label: "Network Firewall Log", href: "/sample_logs/firewall.log" },
  { label: "Application JSONL Logins", href: "/sample_logs/application_logins.jsonl" },
];

export function UploadLogsPage() {
  const { notify } = useToast();
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitFile() {
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

  async function submitUrl() {
    if (!url.trim()) return;
    setLoading(true);
    setProgress(30);
    try {
      setProgress(60);
      const response = await ingestLogsFromUrl(url.trim());
      setProgress(100);
      setResult(response);
      notify(`Fetched & parsed ${response.parsed_count} events from remote URL`, "success");
    } catch (err: any) {
      notify(err.response?.data?.detail || "Failed to fetch remote log URL", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* Upload Zone & Preview */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
        {/* Mode Selector Tabs */}
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5 shadow-inner">
          <button
            onClick={() => setMode("file")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition shadow-clay-pill ${
              mode === "file"
                ? "border border-purple-400/40 bg-purple-500/25 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Local File Upload
          </button>
          <button
            onClick={() => setMode("url")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition shadow-clay-pill ${
              mode === "url"
                ? "border border-cyan-400/40 bg-cyan-500/25 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Link2 className="h-4 w-4" />
            Ingest from Web Link / URL
          </button>
        </div>

        {mode === "file" ? (
          <div>
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
                onClick={submitFile}
              >
                <UploadCloud className="h-4 w-4" />
                {loading ? "Ingesting Telemetry..." : "Ingest & Parse Logs"}
              </button>
              <div className="h-3 min-w-48 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/40 p-0.5 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="rounded-2xl border border-cyan-400/20 bg-black/30 p-6 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-clay-pill">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Remote Log Stream / Webhook URL</h3>
                  <p className="text-xs text-zinc-400">Pull logs directly from a public URL, GitHub raw file, or cloud log bucket</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/logs/access.log (or GitHub raw URL)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 shadow-inner focus:border-cyan-400/60 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-zinc-500 font-medium">Quick Test Feeds:</span>
                  <button
                    type="button"
                    onClick={() => setUrl("https://raw.githubusercontent.com/logpai/loghub/master/Apache/Apache_2k.log")}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-cyan-300 hover:bg-white/10"
                  >
                    Apache 2K Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl("https://raw.githubusercontent.com/logpai/loghub/master/OpenSSH/OpenSSH_2k.log")}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-cyan-300 hover:bg-white/10"
                  >
                    OpenSSH 2K Sample
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                className="clay-button flex items-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-clay-btn hover:from-cyan-500/40 hover:to-purple-500/40 disabled:opacity-40"
                disabled={!url.trim() || loading}
                onClick={submitUrl}
              >
                <Link2 className="h-4 w-4" />
                {loading ? "Fetching Remote Feed..." : "Fetch & Ingest Log URL"}
              </button>
              {loading && (
                <span className="text-xs font-mono text-cyan-300 animate-pulse">
                  Streaming bytes over HTTP...
                </span>
              )}
            </div>
          </div>
        )}

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
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{event.source_ip ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400 truncate max-w-xs">{event.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-black/20 p-8 text-center text-xs text-zinc-500">
              No telemetry ingested yet. Upload a log file or fetch from a URL to see live normalization.
            </div>
          )}
        </div>
      </section>

      {/* Sidebar Guidelines & Built-in Samples */}
      <section className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Sample Datasets</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Download pre-configured realistic attack logs to test detection pipelines and trigger behavioral alarms.
          </p>
          <div className="space-y-2.5">
            {samples.map((sample) => (
              <a
                key={sample.href}
                href={sample.href}
                download
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-medium text-zinc-200 transition hover:border-purple-400/40 hover:bg-white/10 hover:text-white shadow-clay-pill"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span>{sample.label}</span>
                </div>
                <Download className="h-4 w-4 text-zinc-400" />
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white mb-2">Ingestion Best Practices</h2>
          <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
            <li>Supports standard Apache/Nginx web access logs with status codes.</li>
            <li>Linux OpenSSH logs will extract invalid user brute-force vectors.</li>
            <li>JSONL payloads can map custom fields directly into telemetry.</li>
            <li>Files up to 2MB are parsed synchronously with zero loss.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
