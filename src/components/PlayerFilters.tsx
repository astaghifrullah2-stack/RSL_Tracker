"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Option = { value: string; label: string };

function FiltersInner({
  teams,
  positions,
  total,
}: {
  teams: Option[];
  positions: Option[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const update = (patch: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const current = sp.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="panel p-4">
      <label className="sr-only" htmlFor="player-search">Search players</label>
      <input
        id="player-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for a player by Roblox username…"
        className="input py-3 text-base"
        autoComplete="off"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <select
          className="input"
          value={sp.get("team") ?? ""}
          onChange={(e) => update({ team: e.target.value })}
          aria-label="Filter by team"
        >
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
          <option value="free">Free agents</option>
        </select>
        <select
          className="input"
          value={sp.get("pos") ?? ""}
          onChange={(e) => update({ pos: e.target.value })}
          aria-label="Filter by position"
        >
          <option value="">All positions</option>
          {positions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          className="input"
          value={sp.get("award") ?? ""}
          onChange={(e) => update({ award: e.target.value })}
          aria-label="Filter by awards"
        >
          <option value="">All players</option>
          <option value="awarded">Individual awards only</option>
          <option value="none">No awards yet</option>
        </select>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-400">
          <span className="font-bold text-white">{total}</span>
          <span>{total === 1 ? "player" : "players"} found</span>
        </div>
      </div>
    </div>
  );
}

export function PlayerFilters(props: { teams: Option[]; positions: Option[]; total: number }) {
  return (
    <Suspense fallback={<div className="h-32" />}>
      <FiltersInner {...props} />
    </Suspense>
  );
}
