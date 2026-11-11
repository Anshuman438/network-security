import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Lock,
  Radar,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { useToast } from "../components/Toast";
import { scanWebsite } from "../services/api";
import type { ScanResult } from "../types";

const QUICK_TARGETS = [
  "https://example.com",
  "https://google.com",
  "https://github.com",
  "https://cloudflare.com",
];

export function ScannerPage() {
  const { notify } = useToast();
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function handleScan(urlToScan?: string) {
    const target = urlToScan || targetUrl;
    if (!target.trim()) return;
    setLoading(true);
    try {
      const data = await scanWebsite(target.trim());
      setResult(data);
      notify(`Audit complete for ${data.hostname}! Generated ${data.events_generated} SIEM events.`, "success");
    } catch (err: any) {
      notify(err.response?.data?.detail || "Website audit failed. Verify domain and try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  function getGradeColor(grade: string) {
    switch (grade) {
      case "A+":
      case "A":
        return "from-emerald-500/30 to-green-500/20 text-emerald-300 border-emerald-400/40";
      case "B":
        return "from-cyan-500/30 to-blue-500/20 text-cyan-300 border-cyan-400/40";
      case "C":
        return "from-amber-500/30 to-yellow-500/20 text-amber-300 border-amber-400/40";
      case "D":
        return "from-orange-500/30 to-rose-500/20 text-orange-300 border-orange-400/40";
      default:
        return "from-rose-500/30 to-red-500/20 text-rose-300 border-rose-400/40";
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-pink-900/40 via-purple-900/30 to-indigo-900/30 p-6 shadow-clay-card backdrop-blur-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-pink-400/30 bg-pink-500/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-pink-300">
                ACTIVE RECONNAISSANCE
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                <Radar className="h-3 w-3 animate-spin text-pink-400" />
                DEFENSIVE AUDITOR
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white">Live Website Security & Vulnerability Scanner</h2>
            <p className="text-xs text-zinc-300">
              Audit any public web domain: test SSL/TLS strength, OWASP security headers, tech stack fingerprinting, and sensitive path exposures.
            </p>
          </div>
        </div>
      </div>

      {/* Target Input Console */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                <Globe className="h-5 w-5 text-pink-400" />
              </div>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Enter website link (e.g. https://example.com or company.org)"
                className="w-full rounded-2xl border border-white/15 bg-black/40 py-3.5 pl-12 pr-4 text-sm font-medium text-white placeholder-zinc-500 shadow-inner focus:border-pink-400/60 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !targetUrl.trim()}
              className="clay-button flex items-center justify-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-clay-btn hover:from-pink-500/40 hover:to-indigo-500/40 disabled:opacity-40"
            >
              <Zap className="h-4 w-4 text-pink-300" />
              {loading ? "Auditing Target..." : "Run Security Audit"}
            </button>
          </div>

          {/* Quick Target Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Quick Presets:</span>
            {QUICK_TARGETS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setTargetUrl(chip);
                  handleScan(chip);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-zinc-300 transition hover:border-pink-400/40 hover:bg-white/10 hover:text-white"
              >
                {chip.replace("https://", "")}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Loading Animation */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/30 p-12 text-center shadow-inner">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-400/40 bg-pink-500/20 text-pink-300 shadow-clay-pill mb-4 animate-pulse">
            <Radar className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-white">Performing Active Defensive Audit</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Resolving DNS records, measuring TLS handshake, evaluating 6 OWASP headers, and probing sensitive path boundaries...
          </p>
        </div>
      )}

      {/* Scan Results */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Metric Cards */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {/* Security Grade Card */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Security Posture</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{result.score}</span>
                  <span className="text-xs text-zinc-400">/ 100</span>
                </div>
                <span className="text-[11px] text-zinc-400">Calculated defensive score</span>
              </div>
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br font-black text-2xl shadow-clay-pill ${getGradeColor(
                  result.grade
                )}`}
              >
                {result.grade}
              </div>
            </div>

            {/* Resolved Host & IP Card */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Target Host & IP</span>
              <div className="mt-1 font-mono text-base font-bold text-white truncate">{result.hostname}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-cyan-300">
                  {result.ip_address}
                </span>
                <span className="text-xs text-zinc-400">HTTP {result.http_status}</span>
              </div>
            </div>

            {/* Latency & Server Banner */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Latency & Fingerprint</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{result.latency_ms}</span>
                <span className="text-xs text-zinc-400">ms roundtrip</span>
              </div>
              <div className="mt-1 truncate font-mono text-xs text-zinc-400">
                {result.server_banner ? `Server: ${result.server_banner}` : "Server banner hidden (Good)"}
              </div>
            </div>

            {/* SIEM Sync Notification */}
            <div className="rounded-3xl border border-purple-400/20 bg-gradient-to-b from-purple-900/30 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">SIEM Telemetry Pushed</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-200">{result.events_generated}</span>
                <span className="text-xs text-zinc-400">Events normalized</span>
              </div>
              <span className="mt-1 text-[11px] text-zinc-400">Logged to Spectre database & alerts feed</span>
            </div>
          </div>

          {/* SSL / TLS Deep Dive Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-clay-pill">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">SSL / TLS Certificate Audit</h3>
                  <p className="text-xs text-zinc-400">Cryptographic transport layer validation</p>
                </div>
              </div>

              <span
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-xs font-bold shadow-clay-pill ${
                  result.ssl.valid
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                    : "border-rose-400/40 bg-rose-500/20 text-rose-300"
                }`}
              >
                {result.ssl.valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {result.ssl.valid ? "CERTIFICATE VALID" : "INVALID / EXPIRED"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 rounded-2xl border border-white/5 bg-black/30 p-4 font-mono text-xs">
              <div>
                <span className="text-zinc-500">Protocol:</span>
                <div className="font-bold text-white">{result.ssl.protocol || "N/A"}</div>
              </div>
              <div>
                <span className="text-zinc-500">Issuer Authority:</span>
                <div className="font-bold text-white truncate">{result.ssl.issuer || "Unknown"}</div>
              </div>
              <div>
                <span className="text-zinc-500">Days Remaining:</span>
                <div className={`font-bold ${result.ssl.days_remaining && result.ssl.days_remaining < 30 ? "text-amber-400" : "text-emerald-400"}`}>
                  {result.ssl.days_remaining ? `${result.ssl.days_remaining} days` : "0"}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">Expires At:</span>
                <div className="font-bold text-white">{result.ssl.expires_at || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* OWASP Security Headers Checklist */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/20 text-purple-300 shadow-clay-pill">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">OWASP HTTP Security Headers Audit</h3>
                <p className="text-xs text-zinc-400">Evaluation against modern web defense standards</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/5 font-bold uppercase text-zinc-300">
                  <tr>
                    <th className="px-4 py-3">Security Header</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Observed Header Value</th>
                    <th className="px-4 py-3">Description & Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {result.headers.map((h) => (
                    <tr key={h.name} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">{h.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold ${
                            h.status === "PASS"
                              ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                              : "border-rose-400/40 bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                        {h.value || <span className="text-zinc-600">Missing from HTTP response</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        <div>{h.description}</div>
                        {h.recommendation && (
                          <div className="mt-1 text-[11px] text-amber-300/90 font-mono">
                            Fix: {h.recommendation}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sensitive Path Probing Results */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-400/40 bg-pink-500/20 text-pink-300 shadow-clay-pill">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sensitive Endpoint Boundary Check</h3>
                <p className="text-xs text-zinc-400">Probing common leak vectors (.env, .git, administrative endpoints)</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {result.paths.map((p) => {
                const isVuln = p.status === "VULNERABLE";
                const isExposed = p.status === "EXPOSED";
                return (
                  <div
                    key={p.path}
                    className={`rounded-2xl border p-4 shadow-clay-card transition ${
                      isVuln
                        ? "border-rose-500/50 bg-rose-950/20"
                        : isExposed
                        ? "border-amber-500/40 bg-amber-950/20"
                        : "border-white/10 bg-black/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white">{p.path}</span>
                      <span
                        className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold ${
                          isVuln
                            ? "border-rose-400/40 bg-rose-500/20 text-rose-300"
                            : isExposed
                            ? "border-amber-400/40 bg-amber-500/20 text-amber-300"
                            : "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {p.status} ({p.status_code})
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-200">{p.name}</div>
                    <p className="mt-1 text-[11px] text-zinc-400 leading-snug">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
