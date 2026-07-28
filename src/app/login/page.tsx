"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const router = useRouter();

  const handleBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Authentication failed.");
      }

      router.push("/worlds");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070709] text-white px-4 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0e0e12]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4 group hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Wazoo Console
          </h1>
          <p className="text-zinc-500 text-sm mt-1 text-center">
            Neuro-symbolic infrastructure for AI agents
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-800/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-300 font-medium">{error}</div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* WorkOS Sign In Button */}
          <Link
            href="/sign-in"
            className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg shadow-white/5 active:scale-[0.98]"
          >
            Sign in with WorkOS
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Toggle Developer Bypass */}
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <button
              onClick={() => setShowBypass(!showBypass)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mx-auto flex items-center gap-1.5 focus:outline-none"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {showBypass
                ? "Hide developer bypass options"
                : "Show developer bypass options"}
            </button>
          </div>

          {/* Bypass Form */}
          {showBypass && (
            <form
              onSubmit={handleBypassSubmit}
              className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="text-xs text-zinc-400 mb-1 leading-relaxed">
                Paste a valid{" "}
                <code className="text-zinc-200 px-1 py-0.5 bg-zinc-900 rounded font-mono">
                  wazoo_console_token
                </code>{" "}
                JWT below to bypass the SSO authentication layer.
              </div>
              <div className="relative">
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your developer token here..."
                  disabled={loading}
                  rows={4}
                  className="w-full bg-[#141419] border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder-zinc-600 transition-all duration-200 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 text-zinc-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Authenticate Bypass
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
