"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function FiltersInner({
  classes,
  teams,
  count,
}: {
  classes: string[];
  teams: string[];
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const update = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: query }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters = !!(searchParams.get("q") || searchParams.get("class") || searchParams.get("team"));

  return (
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_190px_220px_auto]">
      <label className="relative">
        <span className="sr-only">Search this playersheet</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search username, UserID, team or role..."
          className="input py-3 pl-10"
          autoComplete="off"
        />
      </label>
      <select
        className="input py-3"
        value={searchParams.get("class") ?? ""}
        onChange={(event) => update({ class: event.target.value })}
        aria-label="Filter by class"
      >
        <option value="">All classes</option>
        {classes.map((className) => <option key={className} value={className}>{className === "UNRATED" ? "Unrated" : `${className} class`}</option>)}
      </select>
      <select
        className="input py-3"
        value={searchParams.get("team") ?? ""}
        onChange={(event) => update({ team: event.target.value })}
        aria-label="Filter by team or nation"
      >
        <option value="">All teams / nations</option>
        {teams.map((team) => <option key={team} value={team}>{team}</option>)}
      </select>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0a1530] px-4 py-3 text-xs text-slate-400">
        <span className="whitespace-nowrap"><strong className="font-black text-white">{count}</strong> players</span>
        {hasFilters ? (
          <button
            type="button"
            className="font-bold text-orange-300 transition hover:text-orange-200"
            onClick={() => {
              setQuery("");
              const sheet = searchParams.get("sheet");
              router.replace(sheet ? `${pathname}?sheet=${sheet}` : pathname, { scroll: false });
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PlayerSheetFilters(props: { classes: string[]; teams: string[]; count: number }) {
  return (
    <Suspense fallback={<div className="h-12 rounded-lg bg-white/[0.03]" />}>
      <FiltersInner {...props} />
    </Suspense>
  );
}
