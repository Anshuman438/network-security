import { useEffect, useState, type ReactNode } from "react";
import { Bell, Database, ShieldAlert, Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SeverityBadge, StatusBadge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { EmptyState, LoadingState } from "../components/State";
import { fetchDashboard } from "../services/api";
import type { DashboardSummary, SeriesPoint } from "../types";
import { formatDate } from "../utils/format";

const severityPalette = [
  "#f43f5e", // Critical: Rose
  "#f97316", // High: Orange
  "#fbbf24", // Medium: Amber
  "#10b981", // Low: Emerald
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
];

export function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading telemetry" />;
  if (!summary) return <EmptyState title="Telemetry unavailable" />;

  return (
    <div className="space-y-6">
      {/* Claymorphic Glass Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-cyan-900/30 p-6 shadow-clay-card backdrop-blur-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-purple-400/30 bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-purple-300">
                SPECTRE DEFENSE GRID
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white">Live SOC Telemetry & Detection Grid</h2>
            <p className="text-xs text-zinc-300">Automated log ingestion, pattern correlation, and real-time behavioral alerting</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 shadow-clay-pill backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Correlation Grid</div>
              <div className="font-semibold text-emerald-300">100% Operational</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 shadow-clay-pill backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Defense Rules</div>
              <div className="font-semibold text-cyan-300">11 Active Rules</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Events Indexed" value={summary.total_events} icon={Database} tone="cyan" />
        <MetricCard title="Total Alerts Triggered" value={summary.total_alerts} icon={Bell} tone="amber" />
        <MetricCard title="Critical Incidents" value={summary.open_critical_alerts} icon={ShieldAlert} tone="red" />
      </div>

      {/* Primary Graphs Row */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <ChartPanel title="Event Ingestion Velocity" subtitle="Real-time log packet ingestion frequency">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={summary.events_over_time}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 17, 26, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "16px",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(16px)",
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} fill="url(#areaGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Alerts by Severity" subtitle="Vulnerability distribution across incidents">
          <Donut data={summary.alerts_by_severity} />
        </ChartPanel>
      </div>

      {/* Secondary Graphs with distinct vivid colors */}
      <div className="grid gap-5 xl:grid-cols-3">
        <ChartPanel title="Top Source IPs" subtitle="Hostile / Active Traffic Origins">
          <HorizontalBars data={summary.top_source_ips} barColor="#10b981" />
        </ChartPanel>
        <ChartPanel title="Targeted Identities" subtitle="Observed User Accounts">
          <HorizontalBars data={summary.top_usernames} barColor="#a855f7" />
        </ChartPanel>
        <ChartPanel title="Event Signatures" subtitle="Classified Telemetry Types">
          <HorizontalBars data={summary.top_event_types} barColor="#06b6d4" />
        </ChartPanel>
      </div>

      {/* Bottom Row: Authentication Graph & Colorful Incident Table */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ChartPanel title="Authentication Velocity" subtitle="Failed authentication attempts vs successful entries">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.login_trends}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 17, 26, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "16px",
                  backdropFilter: "blur(16px)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="failed" fill="#f43f5e" name="Failed Logins" radius={[6, 6, 0, 0]} />
              <Bar dataKey="success" fill="#10b981" name="Successful Logins" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Colorful Glassmorphic Incident Table */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">Recent Incidents</h2>
              <p className="text-xs text-zinc-400">Live alert triage feed</p>
            </div>
            <span className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-3 py-1 font-mono text-[10px] font-bold text-rose-300 shadow-clay-pill">
              ALERT STREAM
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="pb-3 font-semibold">Incident</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {summary.recent_alerts.map((alert, idx) => (
                  <tr
                    key={alert.id}
                    className={`transition-colors hover:bg-white/10 ${
                      idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                    }`}
                  >
                    <td className="py-3 pr-2 font-medium text-white">{alert.title}</td>
                    <td className="py-3 pr-2">
                      <SeverityBadge value={alert.severity} />
                    </td>
                    <td className="py-3 pr-2">
                      <StatusBadge value={alert.status} />
                    </td>
                    <td className="py-3 font-mono text-[11px] text-cyan-300">{formatDate(alert.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl transition hover:border-white/20">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function HorizontalBars({ data, barColor }: { data: SeriesPoint[]; barColor: string }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ left: 14, right: 14 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
        <YAxis dataKey="label" type="category" width={92} stroke="#94a3b8" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 17, 26, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            backdropFilter: "blur(16px)",
          }}
        />
        <Bar dataKey="value" fill={barColor} radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={68} outerRadius={100} paddingAngle={4}>
          {data.map((_, index) => (
            <Cell key={index} fill={severityPalette[index % severityPalette.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(15, 17, 26, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            backdropFilter: "blur(16px)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
