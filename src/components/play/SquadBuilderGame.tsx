"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { FutCard } from "@/components/play/FutCard";
import { PlaySubnav } from "@/components/play/PlayChrome";
import type { CommunitySquad } from "@/db/schema";
import type { ArcadePlayer } from "@/lib/arcade-data";
import { cn, formatWage } from "@/lib/site";

type SlotDef = {
  id: string;
  label: string;
  pref: "GK" | "DEF" | "MID" | "FWD";
  x: number; // % from left
  y: number; // % from top
};

type FormationDef = {
  key: string;
  name: string;
  mode: string;
  slots: SlotDef[];
  links: Array<[string, string]>;
};

const FORMATIONS: FormationDef[] = [
  {
    key: "6v6-1221",
    name: "TCS 6v6 · 1-2-2-1",
    mode: "6v6",
    slots: [
      { id: "st", label: "ST", pref: "FWD", x: 50, y: 16 },
      { id: "lm", label: "LM", pref: "MID", x: 24, y: 42 },
      { id: "rm", label: "RM", pref: "MID", x: 76, y: 42 },
      { id: "lcb", label: "LCB", pref: "DEF", x: 32, y: 68 },
      { id: "rcb", label: "RCB", pref: "DEF", x: 68, y: 68 },
      { id: "gk", label: "GK", pref: "GK", x: 50, y: 88 },
    ],
    links: [
      ["st", "lm"],
      ["st", "rm"],
      ["lm", "rm"],
      ["lm", "lcb"],
      ["rm", "rcb"],
      ["lcb", "rcb"],
      ["lcb", "gk"],
      ["rcb", "gk"],
    ],
  },
  {
    key: "6v6-1212",
    name: "TCS 6v6 · 1-2-1-2",
    mode: "6v6",
    slots: [
      { id: "lst", label: "LST", pref: "FWD", x: 34, y: 17 },
      { id: "rst", label: "RST", pref: "FWD", x: 66, y: 17 },
      { id: "cam", label: "CAM", pref: "MID", x: 50, y: 43 },
      { id: "lcb", label: "LCB", pref: "DEF", x: 30, y: 68 },
      { id: "rcb", label: "RCB", pref: "DEF", x: 70, y: 68 },
      { id: "gk", label: "GK", pref: "GK", x: 50, y: 88 },
    ],
    links: [
      ["lst", "rst"],
      ["lst", "cam"],
      ["rst", "cam"],
      ["cam", "lcb"],
      ["cam", "rcb"],
      ["lcb", "rcb"],
      ["lcb", "gk"],
      ["rcb", "gk"],
    ],
  },
  {
    key: "7v7-1231",
    name: "RSL 7v7 · 1-2-3-1",
    mode: "7v7",
    slots: [
      { id: "st", label: "ST", pref: "FWD", x: 50, y: 14 },
      { id: "lw", label: "LW", pref: "FWD", x: 20, y: 38 },
      { id: "cm", label: "CM", pref: "MID", x: 50, y: 42 },
      { id: "rw", label: "RW", pref: "FWD", x: 80, y: 38 },
      { id: "lcb", label: "LCB", pref: "DEF", x: 32, y: 68 },
      { id: "rcb", label: "RCB", pref: "DEF", x: 68, y: 68 },
      { id: "gk", label: "GK", pref: "GK", x: 50, y: 88 },
    ],
    links: [
      ["st", "lw"],
      ["st", "cm"],
      ["st", "rw"],
      ["lw", "cm"],
      ["cm", "rw"],
      ["lw", "lcb"],
      ["cm", "lcb"],
      ["cm", "rcb"],
      ["rw", "rcb"],
      ["lcb", "rcb"],
      ["lcb", "gk"],
      ["rcb", "gk"],
    ],
  },
  {
    key: "11v11-433",
    name: "Full XI · 4-3-3",
    mode: "11v11",
    slots: [
      { id: "lw", label: "LW", pref: "FWD", x: 20, y: 18 },
      { id: "st", label: "ST", pref: "FWD", x: 50, y: 14 },
      { id: "rw", label: "RW", pref: "FWD", x: 80, y: 18 },
      { id: "lcm", label: "LCM", pref: "MID", x: 28, y: 42 },
      { id: "cdm", label: "CDM", pref: "MID", x: 50, y: 46 },
      { id: "rcm", label: "RCM", pref: "MID", x: 72, y: 42 },
      { id: "lb", label: "LB", pref: "DEF", x: 14, y: 68 },
      { id: "lcb", label: "LCB", pref: "DEF", x: 38, y: 70 },
      { id: "rcb", label: "RCB", pref: "DEF", x: 62, y: 70 },
      { id: "rb", label: "RB", pref: "DEF", x: 86, y: 68 },
      { id: "gk", label: "GK", pref: "GK", x: 50, y: 89 },
    ],
    links: [
      ["lw", "st"],
      ["st", "rw"],
      ["lw", "lcm"],
      ["st", "cdm"],
      ["rw", "rcm"],
      ["lcm", "cdm"],
      ["cdm", "rcm"],
      ["lb", "lcm"],
      ["lcb", "cdm"],
      ["rcb", "cdm"],
      ["rb", "rcm"],
      ["lb", "lcb"],
      ["lcb", "rcb"],
      ["rcb", "rb"],
      ["lcb", "gk"],
      ["rcb", "gk"],
    ],
  },
];

const BUDGET_CAPS = [
  { key: "none", label: "Unlimited Wage Cap", cap: null },
  { key: "std", label: "S4 Cap ($2,100,000)", cap: 2100000 },
  { key: "hard", label: "Moneyball ($1,350,000)", cap: 1350000 },
] as const;

function linkStrength(a: ArcadePlayer | undefined, b: ArcadePlayer | undefined): 0 | 1 | 2 {
  if (!a || !b) return 0;
  const sharedClub = a.clubs.some((c) => b.clubs.includes(c));
  if (sharedClub || (a.isS1Winner && b.isS1Winner)) return 2;
  const sharedTier = a.tier === b.tier;
  const sharedSeasons = a.seasons.filter((s) => b.seasons.includes(s)).length >= 2;
  if (sharedTier || sharedSeasons) return 1;
  return 0;
}

export function SquadBuilderGame({
  players,
  initialSquads,
  initialLoadId,
}: {
  players: ArcadePlayer[];
  initialSquads: CommunitySquad[];
  initialLoadId?: number;
}) {
  const router = useRouter();
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const initialLoaded = useMemo(() => {
    if (!initialLoadId) return null;
    const sq = initialSquads.find((s) => s.id === initialLoadId);
    if (!sq) return null;
    const matchedForm =
      FORMATIONS.find((f) => f.name === sq.formation || f.key === sq.formation) ??
      FORMATIONS.find((f) => f.mode === sq.mode) ??
      FORMATIONS[0];
    const slots: Record<string, number> = {};
    try {
      const parsed = JSON.parse(sq.slotsJson) as Array<{ slotId: string; playerId: number }>;
      for (const item of parsed) {
        if (playerById.has(item.playerId)) slots[item.slotId] = item.playerId;
      }
    } catch {
      // Ignore malformed JSON
    }
    return { formationKey: matchedForm.key, slots };
  }, [initialLoadId, initialSquads, playerById]);

  const [formationKey, setFormationKey] = useState<string>(
    () => initialLoaded?.formationKey ?? FORMATIONS[0].key,
  );
  const [budgetKey, setBudgetKey] = useState<string>("none");
  const [lineup, setLineup] = useState<Record<string, number>>(
    () => initialLoaded?.slots ?? {},
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [posFilter, setPosFilter] = useState<string>("");

  const [squadTitle, setSquadTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [squads, setSquads] = useState<CommunitySquad[]>(initialSquads);

  const formation = useMemo(
    () => FORMATIONS.find((f) => f.key === formationKey) ?? FORMATIONS[0],
    [formationKey],
  );
  const budgetCap = BUDGET_CAPS.find((b) => b.key === budgetKey)?.cap ?? null;

  function loadCommunitySquad(sq: CommunitySquad) {
    const matchedForm =
      FORMATIONS.find((f) => f.name === sq.formation || f.key === sq.formation) ??
      FORMATIONS.find((f) => f.mode === sq.mode) ??
      FORMATIONS[0];
    setFormationKey(matchedForm.key);
    try {
      const parsed = JSON.parse(sq.slotsJson) as Array<{ slotId: string; playerId: number }>;
      const next: Record<string, number> = {};
      for (const item of parsed) {
        if (playerById.has(item.playerId)) next[item.slotId] = item.playerId;
      }
      setLineup(next);
      setPublishMsg({ ok: true, text: `Loaded "${sq.title}" by ${sq.author} onto the pitch!` });
    } catch {
      // Ignore malformed JSON
    }
  }



  const usedIds = useMemo(() => new Set(Object.values(lineup)), [lineup]);

  const stats = useMemo(() => {
    const chosen = formation.slots
      .map((s) => ({ slot: s, player: lineup[s.id] ? playerById.get(lineup[s.id]) : undefined }))
      .filter((x): x is { slot: SlotDef; player: ArcadePlayer } => !!x.player);

    const filled = chosen.length;
    const avgOvr = filled
      ? Math.round(chosen.reduce((acc, x) => acc + x.player.peakOvr, 0) / filled)
      : 0;
    const totalWage = chosen.reduce((acc, x) => acc + x.player.s4Wage, 0);

    // Position fit + link strength -> 0..33 chemistry
    let chemPoints = 0;
    for (const { slot, player } of chosen) {
      if (player.position === slot.pref) chemPoints += 2.5;
      else chemPoints += 1;
    }
    for (const [sA, sB] of formation.links) {
      const pA = lineup[sA] ? playerById.get(lineup[sA]) : undefined;
      const pB = lineup[sB] ? playerById.get(lineup[sB]) : undefined;
      chemPoints += linkStrength(pA, pB) * 1.6;
    }
    const maxScale = formation.slots.length * 4.2;
    const chemistry = filled
      ? Math.min(33, Math.round((chemPoints / maxScale) * 33))
      : 0;

    return { filled, totalSlots: formation.slots.length, avgOvr, totalWage, chemistry };
  }, [formation, lineup, playerById]);

  const overBudget = budgetCap !== null && stats.totalWage > budgetCap;

  function autoBuildSquad() {
    const next: Record<string, number> = {};
    const taken = new Set<number>();
    const perSlotCap = budgetCap ? Math.floor(budgetCap / formation.slots.length) : Infinity;

    for (const slot of formation.slots) {
      const fitPool = players.filter(
        (p) => !taken.has(p.id) && p.position === slot.pref && p.s4Wage <= perSlotCap * 1.25,
      );
      const fallbackPool = players.filter(
        (p) => !taken.has(p.id) && p.s4Wage <= perSlotCap * 1.25,
      );
      const pick = fitPool[0] ?? fallbackPool[0] ?? players.find((p) => !taken.has(p.id));
      if (pick) {
        next[slot.id] = pick.id;
        taken.add(pick.id);
      }
    }
    setLineup(next);
    setActiveSlot(null);
  }

  const slotDef = formation.slots.find((s) => s.id === activeSlot) ?? null;

  const pickerPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const targetPos = posFilter || slotDef?.pref || "";
    return players
      .filter((p) => {
        if (targetPos && targetPos !== "ALL" && p.position !== targetPos) return false;
        if (q) {
          return (
            p.username.toLowerCase().includes(q) ||
            p.primaryClub.toLowerCase().includes(q) ||
            p.detailedPosition.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .slice(0, 30);
  }, [players, posFilter, query, slotDef]);

  async function publishSquad(e: FormEvent) {
    e.preventDefault();
    if (stats.filled < stats.totalSlots) {
      setPublishMsg({ ok: false, text: "Fill every position on the pitch before publishing!" });
      return;
    }
    if (overBudget) {
      setPublishMsg({ ok: false, text: "Your squad exceeds the selected Wage Cap!" });
      return;
    }
    setPublishing(true);
    setPublishMsg(null);
    try {
      const slots = formation.slots.map((s) => ({
        slotId: s.id,
        playerId: lineup[s.id],
      }));
      const res = await fetch("/api/play/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: squadTitle,
          author: authorName,
          formation: formation.name,
          mode: formation.mode,
          ovr: stats.avgOvr,
          chemistry: stats.chemistry,
          totalWage: stats.totalWage,
          slots,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; squad?: CommunitySquad };
      if (!res.ok || !data.ok || !data.squad) {
        setPublishMsg({ ok: false, text: data.error || "Could not publish squad." });
      } else {
        setSquads((prev) => [data.squad!, ...prev]);
        setSquadTitle("");
        setPublishMsg({ ok: true, text: "🏆 Squad published to the Community Showcase!" });
        router.refresh();
      }
    } catch {
      setPublishMsg({ ok: false, text: "Network error while publishing squad." });
    } finally {
      setPublishing(false);
    }
  }

  async function likeSquad(id: number) {
    try {
      const res = await fetch("/api/play/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", squadId: id }),
      });
      const data = (await res.json()) as { ok?: boolean; squad?: CommunitySquad };
      if (data.ok && data.squad) {
        setSquads((prev) => prev.map((s) => (s.id === id ? data.squad! : s)));
      }
    } catch {
      // Ignore network error
    }
  }

  return (
    <>
      <PlaySubnav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">RSL ARCADE / TACTICAL LAB</p>
          <h1 className="page-title">
            Squad builder<span className="text-orange-400">.</span>
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Build your dream TCS 6v6, 7v7 or Full XI RSL squad with live club/season chemistry links and S4 wage-cap challenges.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={formationKey}
            onChange={(e) => {
              setFormationKey(e.target.value);
              setLineup({});
              setActiveSlot(null);
            }}
            className="input w-auto py-1.5 text-xs font-bold"
            aria-label="Choose formation"
          >
            {FORMATIONS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={budgetKey}
            onChange={(e) => setBudgetKey(e.target.value)}
            className="input w-auto py-1.5 text-xs font-bold"
            aria-label="Choose wage cap"
          >
            {BUDGET_CAPS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>

          <button type="button" onClick={autoBuildSquad} className="btn btn-primary btn-sm">
            ⚡ Auto-draft
          </button>
          <button
            type="button"
            onClick={() => {
              setLineup({});
              setActiveSlot(null);
            }}
            className="btn btn-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Live Squad Metrics */}
      <div className="panel mb-6 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Players</p>
          <p className="mt-0.5 text-2xl font-black text-white">
            {stats.filled}/{stats.totalSlots}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Squad Rating</p>
          <p className="mt-0.5 text-2xl font-black text-amber-300">{stats.avgOvr} OVR</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Chemistry</p>
          <p className="mt-0.5 text-2xl font-black text-sky-300">⚡ {stats.chemistry}/33</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">S4 Wage Bill</p>
          <p className={cn("mt-0.5 font-mono text-xl font-black", overBudget ? "text-red-400" : "text-orange-300")}>
            {formatWage(stats.totalWage)}
          </p>
          {budgetCap ? (
            <p className="text-[10px] text-slate-400">Cap: {formatWage(budgetCap)}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* Floodlit Tactical Pitch */}
        <div className="relative min-h-[620px] overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-[#0d2c24] via-[#0a2229] to-[#08162c] p-4 shadow-2xl sm:min-h-[680px]">
          {/* Pitch SVG lines + Chemistry links */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Outer touchline & halfway */}
            <rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.35" />
            <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(255,255,255,0.14)" strokeWidth="0.35" />
            <circle cx="50" cy="50" r="11" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.35" />
            <rect x="26" y="4" width="48" height="14" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.35" />
            <rect x="26" y="82" width="48" height="14" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.35" />

            {/* Chemistry links */}
            {formation.links.map(([idA, idB]) => {
              const sA = formation.slots.find((s) => s.id === idA);
              const sB = formation.slots.find((s) => s.id === idB);
              if (!sA || !sB) return null;
              const pA = lineup[idA] ? playerById.get(lineup[idA]) : undefined;
              const pB = lineup[idB] ? playerById.get(lineup[idB]) : undefined;
              const strength = linkStrength(pA, pB);
              const stroke =
                strength === 2
                  ? "#f5c639"
                  : strength === 1
                    ? "#ff7518"
                    : "rgba(255,255,255,0.16)";
              return (
                <line
                  key={`${idA}-${idB}`}
                  x1={sA.x}
                  y1={sA.y}
                  x2={sB.x}
                  y2={sB.y}
                  stroke={stroke}
                  strokeWidth={strength > 0 ? "0.75" : "0.4"}
                  strokeDasharray={strength === 0 ? "1.4 1.4" : undefined}
                />
              );
            })}
          </svg>

          {/* Player slots */}
          {formation.slots.map((slot) => {
            const p = lineup[slot.id] ? playerById.get(lineup[slot.id]) : undefined;
            const isSelected = activeSlot === slot.id;
            return (
              <div
                key={slot.id}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                {p ? (
                  <div className="relative">
                    <FutCard
                      player={p}
                      size="sm"
                      selected={isSelected}
                      subtitle={slot.label}
                      onClick={() => {
                        setActiveSlot(slot.id);
                        setPosFilter(slot.pref);
                      }}
                      className="w-[92px] sm:w-[108px]"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLineup((prev) => {
                          const copy = { ...prev };
                          delete copy[slot.id];
                          return copy;
                        });
                      }}
                      title="Remove player"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/25 bg-black/80 text-[10px] font-black text-white hover:bg-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlot(slot.id);
                      setPosFilter(slot.pref);
                    }}
                    className={cn(
                      "flex h-20 w-16 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-[#071126]/85 text-center backdrop-blur-sm transition hover:scale-105 hover:border-orange-400 sm:h-24 sm:w-20",
                      isSelected ? "border-orange-400 ring-2 ring-orange-400/40" : "border-white/25",
                    )}
                  >
                    <span className="text-lg font-black text-orange-300">+</span>
                    <span className="text-[11px] font-black text-white">{slot.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column: Slot player picker + Publish to Community */}
        <div className="space-y-5">
          {slotDef ? (
            <div className="panel p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="eyebrow">ASSIGN POSITION</p>
                  <h3 className="mt-0.5 text-base font-black text-white">
                    Pick {slotDef.label} ({slotDef.pref})
                  </h3>
                </div>
                <button type="button" onClick={() => setActiveSlot(null)} className="btn btn-sm">
                  Done
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search RSL player or club…"
                  className="input flex-1 text-xs"
                />
                <select
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                  className="input w-28 text-xs"
                  aria-label="Position filter"
                >
                  <option value="ALL">All pos</option>
                  <option value="GK">GK</option>
                  <option value="DEF">DEF</option>
                  <option value="MID">MID</option>
                  <option value="FWD">FWD</option>
                </select>
              </div>

              <ul className="mt-3 max-h-80 divide-y divide-white/[0.06] overflow-y-auto">
                {pickerPlayers.map((p) => {
                  const taken = usedIds.has(p.id) && lineup[slotDef.id] !== p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={taken}
                        onClick={() => {
                          setLineup((prev) => ({ ...prev, [slotDef.id]: p.id }));
                          setActiveSlot(null);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-3 px-2 py-2.5 text-left transition hover:bg-white/[0.05] disabled:opacity-40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.avatarUrl}
                          alt={p.username}
                          className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-white">{p.username}</p>
                          <p className="truncate text-[10px] text-slate-400">
                            {p.detailedPosition} · {p.primaryClub} · {formatWage(p.s4Wage)}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-black text-amber-300">
                          {p.peakOvr}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="panel p-5">
              <p className="eyebrow">CHEMISTRY GUIDE</p>
              <h3 className="mt-1 text-base font-black text-white">Link your teammates</h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
                <li>
                  <strong className="text-amber-300">━━ Gold Strong Link:</strong> Shared club history or Villareal S1 Champions teammates.
                </li>
                <li>
                  <strong className="text-orange-300">━━ Orange Link:</strong> Same card tier or 2+ RSL seasons played together.
                </li>
                <li>Click any slot on the pitch to pick a player, or hit <strong>⚡ Auto-draft</strong>!</li>
              </ul>
            </div>
          )}

          {/* Publish squad form */}
          <form onSubmit={publishSquad} className="panel space-y-3 p-5">
            <p className="eyebrow">COMMUNITY SHOWCASE</p>
            <h3 className="text-base font-black text-white">Publish this lineup</h3>
            <input
              value={squadTitle}
              onChange={(e) => setSquadTitle(e.target.value)}
              required
              maxLength={60}
              placeholder="Squad name (e.g. All-Time Iberian 6v6)"
              className="input text-xs"
            />
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              maxLength={32}
              placeholder="Your name / Roblox handle"
              className="input text-xs"
            />
            {publishMsg ? (
              <p className={cn("text-xs font-bold", publishMsg.ok ? "text-orange-300" : "text-red-300")}>
                {publishMsg.text}
              </p>
            ) : null}
            <button type="submit" disabled={publishing} className="btn btn-primary w-full text-xs">
              {publishing ? "Publishing…" : "Publish Squad to Showcase ↗"}
            </button>
          </form>
        </div>
      </div>

      {/* Community Squads Gallery */}
      <section className="mt-10">
        <div className="mb-4">
          <p className="eyebrow mb-1">SAVED IN THE DATABASE</p>
          <h2 className="text-2xl font-black text-white">
            Community squads<span className="text-orange-400">.</span>
          </h2>
        </div>

        {squads.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {squads.map((sq) => (
              <div key={sq.id} className="panel flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip chip-orange">{sq.formation}</span>
                    <button
                      type="button"
                      onClick={() => likeSquad(sq.id)}
                      className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-black text-rose-300 transition hover:bg-rose-500/25"
                    >
                      ♥ {sq.likes}
                    </button>
                  </div>
                  <h3 className="mt-3 truncate text-lg font-black text-white">{sq.title}</h3>
                  <p className="text-xs text-slate-400">Built by {sq.author}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <div className="flex gap-3">
                    <span className="font-black text-amber-300">{sq.ovr} OVR</span>
                    <span className="font-bold text-sky-300">⚡ {sq.chemistry}/33</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadCommunitySquad(sq)}
                    className="font-extrabold text-orange-300 hover:underline"
                  >
                    Load onto pitch →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel p-8 text-center text-sm text-slate-400">
            Complete all positions on the pitch and publish the first RSL dream squad!
          </div>
        )}
      </section>
    </>
  );
}
