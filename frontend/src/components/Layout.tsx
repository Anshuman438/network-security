import {
  Activity,
  Bell,
  Database,
  Eye,
  FileUp,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthProvider";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, color: "text-cyan-400" },
  { to: "/events", label: "Events", icon: Activity, color: "text-sky-400" },
  { to: "/alerts", label: "Alerts", icon: Bell, color: "text-rose-400" },
  { to: "/rules", label: "Rules", icon: SlidersHorizontal, color: "text-violet-400" },
  { to: "/upload", label: "Upload Logs", icon: FileUp, color: "text-emerald-400" },
  { to: "/scanner", label: "Web Scanner", icon: Globe, color: "text-pink-400" },
  { to: "/threat-intel", label: "Threat Intel", icon: Radar, color: "text-purple-400" },
  { to: "/admin", label: "Admin", icon: Users, color: "text-amber-400", adminOnly: true },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = nav.find((item) => item.to === location.pathname)?.label ?? "Spectre";
  const [clock, setClock] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-zinc-950/75 p-4 shadow-[8px_0_36px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
      {/* 3D Clay Brand Emblem */}
      <Link
        to="/"
        className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-3 shadow-clay-card transition duration-200 hover:border-purple-400/40 hover:-translate-y-0.5"
        onClick={() => setOpen(false)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-500/35 via-indigo-600/30 to-cyan-500/30 text-purple-200 shadow-clay-pill">
          <Eye className="h-5 w-5 transition group-hover:scale-110" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-base font-black tracking-wider text-white">SPECTRE</span>
            <span className="rounded-lg border border-purple-400/40 bg-purple-500/25 px-1.5 py-0.5 text-[9px] font-bold text-purple-200 shadow-clay-pill">
              SOC
            </span>
          </div>
          <div className="text-[11px] text-zinc-400">Threat Intelligence Lab</div>
        </div>
      </Link>

      {/* Tactile 3D Clay Navigation Items */}
      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {nav
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "border border-purple-400/50 bg-gradient-to-r from-purple-600/35 via-indigo-600/25 to-purple-500/15 text-white shadow-clay-btn"
                      : "border border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-white hover:shadow-clay-pill hover:-translate-y-0.5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all ${
                        isActive
                          ? "border-purple-400/40 bg-purple-500/30 text-purple-200 shadow-clay-pill"
                          : "border-white/5 bg-white/[0.03] text-zinc-400 group-hover:border-white/10 group-hover:bg-white/10 group-hover:text-zinc-200"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-purple-200" : item.color}`} />
                    </div>
                    <span className="tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Tactile 3D User Card & Logout */}
      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-3.5 shadow-clay-card backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-400/30 bg-purple-500/20 text-xs font-bold text-purple-200 uppercase font-mono shadow-clay-pill">
                {user?.username?.charAt(0) ?? "U"}
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-none">{user?.username}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">SOC Verified</div>
              </div>
            </div>
            <span className="rounded-lg border border-purple-400/40 bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-purple-200 shadow-clay-pill">
              {user?.role}
            </span>
          </div>
        </div>
        <button
          className="clay-button flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white"
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5 text-rose-400" />
          Terminate Session
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden">
          <div className="h-full">{sidebar}</div>
          <button
            className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-zinc-900/90 p-2 text-zinc-100 shadow-clay-btn"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <main className="lg:pl-72">
        {/* Glassmorphic Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-4 backdrop-blur-2xl md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/10 lg:hidden shadow-clay-btn"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold tracking-tight text-white">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {clock && (
              <span className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-zinc-300 shadow-clay-pill backdrop-blur-md sm:inline">
                {clock} UTC
              </span>
            )}
            <span className="rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-1 text-xs font-bold text-emerald-300 shadow-clay-pill backdrop-blur-md">
              SHIELD ACTIVE
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
