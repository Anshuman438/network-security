import { FormEvent, useCallback, useEffect, useState } from "react";
import { DatabaseZap, Plus, RotateCcw, ShieldCheck, Trash2, Users } from "lucide-react";

import { EmptyState, LoadingState } from "../components/State";
import { useToast } from "../components/Toast";
import { clearDemo, createUser, fetchAdminStats, fetchUsers, seedDemo } from "../services/api";
import type { Page, Role, User } from "../types";

export function AdminPage() {
  const { notify } = useToast();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<Page<User> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [statsResult, usersResult] = await Promise.all([fetchAdminStats(), fetchUsers({ page_size: 50 })]);
    setStats(statsResult);
    setUsers(usersResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function seed() {
    await seedDemo();
    notify("Demo data re-seeded with 700+ events", "success");
    await load();
  }

  async function clear() {
    await clearDemo();
    notify("Database flushed cleanly", "success");
    await load();
  }

  if (loading) return <LoadingState label="Loading admin telemetry" />;

  const statColors: Record<string, string> = {
    events: "border-cyan-400/40 text-cyan-300 from-cyan-500/10 to-transparent",
    alerts: "border-rose-400/40 text-rose-300 from-rose-500/10 to-transparent",
    rules: "border-purple-400/40 text-purple-300 from-purple-500/10 to-transparent",
    users: "border-emerald-400/40 text-emerald-300 from-emerald-500/10 to-transparent",
    threat_indicators: "border-amber-400/40 text-amber-300 from-amber-500/10 to-transparent",
    raw_logs: "border-indigo-400/40 text-indigo-300 from-indigo-500/10 to-transparent",
  };

  return (
    <div className="space-y-6">
      {/* 6 Mini Clay Stat Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {stats
          ? Object.entries(stats).map(([key, value]) => {
              const styling = statColors[key] ?? "border-white/10 text-white from-white/5 to-transparent";
              return (
                <div
                  key={key}
                  className={`rounded-2xl border bg-gradient-to-br ${styling} p-4 shadow-clay-card backdrop-blur-2xl transition hover:-translate-y-0.5`}
                >
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">{key.replace("_", " ")}</div>
                  <div className="mt-1.5 text-2xl font-black tracking-tight">{value}</div>
                </div>
              );
            })
          : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* User Accounts Management Table */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-5 shadow-clay-card backdrop-blur-2xl">
          <div className="mb-4 flex items-center gap-2.5 border-b border-white/10 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/20 text-cyan-300 shadow-clay-pill">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">System Users & Roles</h2>
              <p className="text-xs text-zinc-400">Manage role-based SOC access permissions</p>
            </div>
          </div>
          {users?.items.length ? <UsersTable users={users.items} /> : <EmptyState title="No users found" />}
        </section>

        {/* User Provisioning & Database Controls */}
        <aside className="space-y-5">
          <UserForm onCreated={load} />

          <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/20 text-emerald-300 shadow-clay-pill">
                <DatabaseZap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Lab Telemetry Seeding</h2>
                <p className="text-xs text-zinc-400">Generate or purge safe simulated logs</p>
              </div>
            </div>
            <div className="grid gap-2.5">
              <button
                className="clay-button flex items-center justify-center gap-2 rounded-2xl border-emerald-400/40 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-200 shadow-clay-btn hover:from-emerald-500/40 hover:to-teal-500/40"
                onClick={seed}
              >
                <RotateCcw className="h-4 w-4" />
                Seed 500+ Simulated Logs
              </button>
              <button
                className="clay-button flex items-center justify-center gap-2 rounded-2xl border-rose-400/40 bg-gradient-to-r from-rose-500/20 to-red-600/20 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-200 shadow-clay-btn hover:from-rose-500/30 hover:to-red-600/30"
                onClick={clear}
              >
                <Trash2 className="h-4 w-4" />
                Purge All Events & Alerts
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase font-bold text-zinc-300">
          <tr>
            <th className="px-4 py-3.5">Username</th>
            <th className="px-4 py-3.5">Email</th>
            <th className="px-4 py-3.5">Clearance Role</th>
            <th className="px-4 py-3.5">Registered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-zinc-200">
          {users.map((user, idx) => (
            <tr
              key={user.id}
              className={`transition-colors hover:bg-white/10 ${
                idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
              }`}
            >
              <td className="px-4 py-3.5 font-bold text-white">{user.username}</td>
              <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">{user.email}</td>
              <td className="px-4 py-3.5">
                <span
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase shadow-clay-pill ${
                    user.role === "admin"
                      ? "border-purple-400/40 bg-purple-500/20 text-purple-200"
                      : user.role === "analyst"
                      ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                      : "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const { notify } = useToast();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "viewer" as Role });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createUser(form);
    notify("User account provisioned", "success");
    setForm({ username: "", email: "", password: "", role: "viewer" });
    await onCreated();
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-clay-card backdrop-blur-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/20 text-purple-300 shadow-clay-pill">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Provision User</h2>
          <p className="text-xs text-zinc-400">Grant SOC access clearance</p>
        </div>
      </div>

      <div className="space-y-3">
        <input
          required
          className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
          placeholder="Username"
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
        />
        <input
          required
          type="email"
          className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
          placeholder="Email Address"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          required
          className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Assigned Role</span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 py-2.5 px-3.5 text-sm text-white shadow-clay-pill focus:outline-none capitalize"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
          >
            <option value="viewer" className="bg-zinc-900">Viewer (Read-only)</option>
            <option value="analyst" className="bg-zinc-900">Analyst (Triage & Notes)</option>
            <option value="admin" className="bg-zinc-900">Admin (Full Control)</option>
          </select>
        </div>
        <button className="clay-button mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-cyan-500/30 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-clay-btn hover:from-purple-500/40 hover:to-cyan-500/40">
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>
    </form>
  );
}
