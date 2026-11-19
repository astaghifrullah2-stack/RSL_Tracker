"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ArcadeScore } from "@/db/schema";
import { cn, playMenuLinks } from "@/lib/site";

export function PlaySubnav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Play arcade modes"
      className="mb-7 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.09] bg-[#0b1530]/90 p-2 [scrollbar-width:none]"
    >
      {playMenuLinks.map((item) => {
        const active =
          item.href === "/play" ? pathname === "/play" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold transition",
              active
                ? "bg-orange-500 text-[#0d1226] shadow-[0_0_20px_rgba(255,117,24,0.25)]"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ScoreSubmitBox({
  game,
  score,
  detail,
  label = "Save score to Hall of Fame",
  onSaved,
}: {
  game: "tic-tac-toe" | "ultimate-team" | "higher-lower";
  score: number;
  detail: string;
  label?: string;
  onSaved?: (entry: ArcadeScore) => void;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (score <= 0) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/play/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, nickname, score, detail }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; entry?: ArcadeScore };
      if (!res.ok || !data.ok || !data.entry) {
        setErr(data.error || "Could not save score.");
      } else {
        setSaved(true);
        onSaved?.(data.entry);
        router.refresh();
      }
    } catch {
      setErr("Network error while saving score.");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div className="rounded-xl border border-orange-400/35 bg-orange-500/12 px-4 py-3 text-xs font-bold text-orange-200">
        🏆 Posted to the RSL Arcade Hall of Fame! ({score} pts)
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-[#0a142e] p-4">
      <p className="text-xs font-extrabold uppercase tracking-wider text-orange-300">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          minLength={2}
          maxLength={28}
          placeholder="Your Roblox / Discord name…"
          className="input min-w-44 flex-1 py-2 text-xs"
        />
        <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
          {busy ? "Posting…" : `Post ${score} pts`}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
    </form>
  );
}

export function MiniLeaderboard({
  title,
  scores,
  unit = "pts",
}: {
  title: string;
  scores: ArcadeScore[];
  unit?: string;
}) {
  return (
    <div className="panel overflow-hidden">
      <header className="border-b border-white/[0.07] px-5 py-3.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">{title}</h3>
      </header>
      {scores.length ? (
        <ul className="divide-y divide-white/[0.06]">
          {scores.slice(0, 8).map((s, idx) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
              <span
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-black",
                  idx === 0 && "bg-amber-400/20 text-amber-300",
                  idx === 1 && "bg-slate-300/15 text-slate-200",
                  idx === 2 && "bg-orange-500/20 text-orange-300",
                  idx > 2 && "bg-white/[0.04] text-slate-400",
                )}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-white">{s.nickname}</p>
                {s.detail ? <p className="truncate text-[10px] text-slate-400">{s.detail}</p> : null}
              </div>
              <span className="font-mono text-sm font-black text-orange-300">
                {s.score} <span className="text-[10px] font-semibold text-slate-400">{unit}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-8 text-center text-xs text-slate-500">
          No scores posted yet — set the first league record!
        </p>
      )}
    </div>
  );
}
