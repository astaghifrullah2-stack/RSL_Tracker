"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Option = { value: string; label: string };

function FiltersInner({
  clubs,
  windows,
}: {
  clubs: Option[];
  windows: Option[];
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
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search players, UserIDs…"
        className="input py-2.5"
        aria-label="Search transfers"
      />
      <select
        className="input sm:w-64"
        value={sp.get("club") ?? ""}
        onChange={(e) => update({ club: e.target.value })}
        aria-label="Filter by club"
      >
        <option value="">All clubs</option>
        {clubs.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        className="input sm:w-56"
        value={sp.get("window") ?? ""}
        onChange={(e) => update({ window: e.target.value })}
        aria-label="Filter by transfer window"
      >
        <option value="">All windows (S1–S4)</option>
        {windows.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TransferFilters(props: { clubs: Option[]; windows: Option[] }) {
  return (
    <Suspense fallback={<div className="h-11" />}>
      <FiltersInner {...props} />
    </Suspense>
  );
}
