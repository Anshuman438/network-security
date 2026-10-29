import { FormEvent, useState } from "react";
import { Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/Toast";

export function LoginPage() {
  const { login, token } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("AdminPass123!");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      notify("Authenticated into Spectre SOC", "success");
      navigate("/");
    } catch {
      notify("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  }

  function setPreset(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-8 shadow-clay-card backdrop-blur-2xl"
      >
        <div className="mb-6 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-purple-200 shadow-clay-pill">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-black tracking-wider text-white">SPECTRE</h1>
              <span className="rounded-lg border border-purple-400/40 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                SOC
              </span>
            </div>
            <p className="text-xs text-zinc-400">Cyber Telemetry & Defense Console</p>
          </div>
        </div>

        {/* Demo profiles in tactile clay pills */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-clay-pill backdrop-blur-md">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Select Clearance Profile:</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Admin", user: "admin", pass: "AdminPass123!" },
              { label: "Analyst", user: "analyst", pass: "AnalystPass123!" },
              { label: "Viewer", user: "viewer", pass: "ViewerPass123!" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setPreset(item.user, item.pass)}
                className={`clay-button py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  username === item.user
                    ? "border-purple-400/50 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 shadow-clay-btn"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-4 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          <span className="mb-1.5 block">Clearance Identity</span>
          <input
            className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
          />
        </label>

        <label className="mb-6 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          <span className="mb-1.5 block">Authentication Key</span>
          <input
            className="focus-ring w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white shadow-inner placeholder:text-zinc-500"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
        </label>

        <button
          className="clay-button flex w-full items-center justify-center gap-2 rounded-2xl border-white/20 bg-gradient-to-r from-purple-500/40 via-indigo-500/40 to-cyan-500/40 py-3 text-sm font-bold tracking-wider text-white uppercase shadow-clay-btn hover:from-purple-500/50 hover:to-cyan-500/50"
          disabled={loading}
        >
          <LockKeyhole className="h-4 w-4" />
          {loading ? "Authenticating..." : "Access Spectre Console"}
        </button>

        <div className="mt-5 text-center font-mono text-[11px] text-zinc-500">
          Tactile Glassmorphic SOC Lab • Zero External Leakage
        </div>
      </form>
    </div>
  );
}
