"use client";

import { useEffect, useMemo, useState } from "react";
import { FutCard } from "@/components/play/FutCard";
import { MiniLeaderboard, PlaySubnav, ScoreSubmitBox } from "@/components/play/PlayChrome";
import type { ArcadeScore } from "@/db/schema";
import type { ArcadePlayer, CardTier } from "@/lib/arcade-data";
import { cn } from "@/lib/site";

const COINS_KEY = "rsl_ut_coins_v1";
const BINDER_KEY = "rsl_ut_binder_v1";

type PackDef = {
  id: "classic" | "promo" | "icon";
  name: string;
  cost: number;
  count: number;
  tagline: string;
  odds: string;
  accent: string;
};

const PACKS: PackDef[] = [
  {
    id: "classic",
    name: "Classic RSL Pack",
    cost: 400,
    count: 3,
    tagline: "3 RSL Player Cards · Guaranteed 80+ OVR",
    odds: "12% Hero/Icon",
    accent: "border-blue-400/40 from-[#162958] to-[#0a132c]",
  },
  {
    id: "promo",
    name: "S-Class Promo Pack",
    cost: 900,
    count: 3,
    tagline: "3 RSL Player Cards · Guaranteed 87+ In-Form",
    odds: "42% Hero/Icon",
    accent: "border-orange-400/50 from-[#431d0c] to-[#0c1532]",
  },
  {
    id: "icon",
    name: "EUROS Icon & Hero Pack",
    cost: 1600,
    count: 4,
    tagline: "4 Elite Cards · Guaranteed ICON or HERO Walkout",
    odds: "100% Hero/Icon",
    accent: "border-amber-300/65 from-[#43330f] via-[#1c1b3a] to-[#0a0f24]",
  },
];

const DRAFT_ROUNDS: Array<{ slot: string; pref: "GK" | "DEF" | "MID" | "FWD" | "ANY" }> = [
  { slot: "Captain (Any)", pref: "ANY" },
  { slot: "Striker (FWD)", pref: "FWD" },
  { slot: "Playmaker (MID)", pref: "MID" },
  { slot: "Box-to-Box (MID)", pref: "MID" },
  { slot: "Center Back (DEF)", pref: "DEF" },
  { slot: "Goalkeeper (GK)", pref: "GK" },
];

function sampleUnique(pool: ArcadePlayer[], n: number, exclude = new Set<number>()): ArcadePlayer[] {
  const avail = pool.filter((p) => !exclude.has(p.id));
  const copy = [...avail];
  const out: ArcadePlayer[] = [];
  while (out.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

type SimMatch = {
  round: string;
  opponent: string;
  userGoals: number;
  oppGoals: number;
  scorers: string[];
  won: boolean;
};

export function UltimateTeamGame({
  players,
  initialScores,
}: {
  players: ArcadePlayer[];
  initialScores: ArcadeScore[];
}) {
  const [tab, setTab] = useState<"packs" | "draft" | "binder">("packs");
  const [coins, setCoins] = useState<number>(2500);
  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Pack reveal state
  const [openedCards, setOpenedCards] = useState<ArcadePlayer[] | null>(null);
  const [dupeRefund, setDupeRefund] = useState<number>(0);
  const [packNotice, setPackNotice] = useState<string | null>(null);

  // Draft state
  const [draftPicks, setDraftPicks] = useState<ArcadePlayer[]>([]);
  const [draftChoices, setDraftChoices] = useState<ArcadePlayer[]>([]);
  const [draftSim, setDraftSim] = useState<{
    matches: SimMatch[];
    champion: boolean;
    reward: number;
    draftScore: number;
  } | null>(null);

  // Binder filter
  const [tierFilter, setTierFilter] = useState<CardTier | "ALL">("ALL");
  const [scores, setScores] = useState<ArcadeScore[]>(initialScores);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      try {
        const savedCoins = Number(localStorage.getItem(COINS_KEY));
        if (Number.isFinite(savedCoins) && savedCoins >= 0) setCoins(savedCoins);
        const savedBinder = JSON.parse(localStorage.getItem(BINDER_KEY) || "[]") as number[];
        if (Array.isArray(savedBinder)) setOwnedIds(savedBinder);
      } catch {
        // Ignore storage errors
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(COINS_KEY, String(coins));
      localStorage.setItem(BINDER_KEY, JSON.stringify(ownedIds));
    } catch {
      // Ignore storage errors
    }
  }, [coins, ownedIds, hydrated]);

  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);

  function openPack(pack: PackDef) {
    if (coins < pack.cost) {
      setPackNotice("Not enough RSL Coins! Play an EUROS Draft or claim the Free Coin Refill.");
      return;
    }

    const iconsAndHeroes = players.filter((p) => p.tier === "ICON" || p.tier === "HERO");
    const promos = players.filter((p) => p.peakOvr >= 87);
    const eighties = players.filter((p) => p.peakOvr >= 80);

    const pulled: ArcadePlayer[] = [];
    const used = new Set<number>();

    if (pack.id === "icon") {
      const top = sampleUnique(iconsAndHeroes, 1, used);
      top.forEach((p) => {
        pulled.push(p);
        used.add(p.id);
      });
      sampleUnique(promos.length >= 4 ? promos : players, pack.count - pulled.length, used).forEach(
        (p) => pulled.push(p),
      );
    } else if (pack.id === "promo") {
      const top = sampleUnique(promos, 1, used);
      top.forEach((p) => {
        pulled.push(p);
        used.add(p.id);
      });
      sampleUnique(eighties, pack.count - pulled.length, used).forEach((p) => pulled.push(p));
    } else {
      const top = sampleUnique(eighties, 1, used);
      top.forEach((p) => {
        pulled.push(p);
        used.add(p.id);
      });
      sampleUnique(players, pack.count - pulled.length, used).forEach((p) => pulled.push(p));
    }

    pulled.sort((a, b) => b.peakOvr - a.peakOvr);

    let refund = 0;
    const nextOwned = new Set(ownedSet);
    for (const card of pulled) {
      if (nextOwned.has(card.id)) {
        refund += card.tier === "ICON" ? 280 : card.tier === "HERO" ? 180 : 90;
      } else {
        nextOwned.add(card.id);
      }
    }

    setCoins((c) => c - pack.cost + refund);
    setOwnedIds([...nextOwned]);
    setOpenedCards(pulled);
    setDupeRefund(refund);
    setPackNotice(null);
  }

  function dealDraftRound(currentPicks: ArcadePlayer[]) {
    const roundIdx = currentPicks.length;
    if (roundIdx >= DRAFT_ROUNDS.length) {
      setDraftChoices([]);
      return;
    }
    const round = DRAFT_ROUNDS[roundIdx];
    const used = new Set(currentPicks.map((p) => p.id));
    if (roundIdx === 0) {
      // Captain round: guaranteed high-tier stars
      const stars = players.filter((p) => p.tier === "ICON" || p.tier === "HERO" || p.peakOvr >= 88);
      setDraftChoices(sampleUnique(stars.length >= 5 ? stars : players, 5, used));
      return;
    }
    const posPool =
      round.pref === "ANY" ? players : players.filter((p) => p.position === round.pref);
    setDraftChoices(sampleUnique(posPool.length >= 5 ? posPool : players, 5, used));
  }

  function startNewDraft() {
    setDraftPicks([]);
    setDraftSim(null);
    dealDraftRound([]);
    setTab("draft");
  }

  function pickDraftCard(card: ArcadePlayer) {
    const next = [...draftPicks, card];
    setDraftPicks(next);
    // Add drafted cards to binder too!
    if (!ownedSet.has(card.id)) {
      setOwnedIds((prev) => [...prev, card.id]);
    }
    dealDraftRound(next);
  }

  const draftSummary = useMemo(() => {
    if (!draftPicks.length) return { ovr: 0, chem: 0, totalScore: 0 };
    const ovr = Math.round(draftPicks.reduce((s, p) => s + p.peakOvr, 0) / draftPicks.length);
    let links = 0;
    for (let i = 0; i < draftPicks.length; i++) {
      for (let j = i + 1; j < draftPicks.length; j++) {
        const a = draftPicks[i];
        const b = draftPicks[j];
        if (a.clubs.some((c) => b.clubs.includes(c)) || (a.isS1Winner && b.isS1Winner)) links += 3;
        else if (a.tier === b.tier || a.seasons.filter((s) => b.seasons.includes(s)).length >= 2)
          links += 1.5;
      }
    }
    const chem = Math.min(33, Math.round(10 + links * 1.4));
    const totalScore = ovr * 10 + chem * 8;
    return { ovr, chem, totalScore };
  }, [draftPicks]);

  function simulateDraftKnockout() {
    if (draftPicks.length < DRAFT_ROUNDS.length || draftSim) return;
    const opponents: Array<{ round: string; name: string; rating: number }> = [
      { round: "Quarter-Final", name: "Italy XI", rating: 83 },
      { round: "Semi-Final", name: "Belgium XI", rating: 86 },
      { round: "EUROS Final", name: "Netherlands XI", rating: 89 },
    ];

    const matches: SimMatch[] = [];
    let eliminated = false;
    let wins = 0;

    const attackers = draftPicks.filter((p) => p.position === "FWD" || p.position === "MID");
    const scorerPool = attackers.length ? attackers : draftPicks;

    for (const opp of opponents) {
      if (eliminated) break;
      const edge = (draftSummary.ovr + draftSummary.chem * 0.22 - opp.rating) / 14;
      const winProb = Math.max(0.28, Math.min(0.86, 0.55 + edge));
      const won = Math.random() < winProb;

      const userGoals = won
        ? 2 + Math.floor(Math.random() * 3)
        : Math.floor(Math.random() * 2);
      const oppGoals = won
        ? Math.max(0, userGoals - (1 + Math.floor(Math.random() * 2)))
        : userGoals + 1 + Math.floor(Math.random() * 2);

      const scorers: string[] = [];
      for (let g = 0; g < userGoals; g++) {
        const sc = scorerPool[Math.floor(Math.random() * scorerPool.length)];
        const min = 8 + Math.floor(Math.random() * 82);
        scorers.push(`${sc.username} ${min}'`);
      }

      matches.push({
        round: opp.round,
        opponent: opp.name,
        userGoals,
        oppGoals,
        scorers,
        won,
      });

      if (won) wins++;
      else eliminated = true;
    }

    const champion = wins === 3;
    const reward = champion ? 1800 : wins === 2 ? 950 : wins === 1 ? 550 : 250;
    const finalScore = draftSummary.totalScore + wins * 150 + (champion ? 250 : 0);

    setCoins((c) => c + reward);
    setDraftSim({ matches, champion, reward, draftScore: finalScore });
  }

  const binderCards = useMemo(() => {
    return players.filter(
      (p) => ownedSet.has(p.id) && (tierFilter === "ALL" || p.tier === tierFilter),
    );
  }, [ownedSet, players, tierFilter]);

  const walkout = openedCards?.[0] ?? null;

  return (
    <>
      <PlaySubnav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">RSL ARCADE / PACKS, BINDER &amp; DRAFT</p>
          <h1 className="page-title">
            Ultimate Team<span className="text-orange-400">.</span>
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Collect real RSL Icons, X-Class Heroes and In-Forms, or enter the 6-pick EUROS Draft to win coins and Hall of Fame glory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/12 px-4 py-2 text-xs font-black text-amber-200">
            🪙 {coins.toLocaleString()} RSL Coins
          </div>
          {coins < 400 ? (
            <button
              type="button"
              onClick={() => setCoins((c) => c + 1000)}
              className="btn btn-sm border-orange-400/45 text-orange-200"
            >
              +1,000 Free Refill
            </button>
          ) : null}
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("packs")}
          className={cn("btn btn-sm", tab === "packs" && "btn-primary")}
        >
          🃏 Pack Store
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("draft");
            if (!draftPicks.length && !draftChoices.length) dealDraftRound([]);
          }}
          className={cn("btn btn-sm", tab === "draft" && "btn-primary")}
        >
          🏆 EUROS FUT Draft
        </button>
        <button
          type="button"
          onClick={() => setTab("binder")}
          className={cn("btn btn-sm", tab === "binder" && "btn-primary")}
        >
          📘 Club Binder ({ownedIds.length}/{players.length})
        </button>
      </div>

      {tab === "packs" ? (
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border bg-gradient-to-b p-5 shadow-xl",
                    pack.accent,
                  )}
                >
                  <div>
                    <span className="chip chip-amber">{pack.odds}</span>
                    <h2 className="mt-3 text-lg font-black text-white">{pack.name}</h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{pack.tagline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPack(pack)}
                    className="btn btn-primary mt-5 w-full text-xs font-extrabold"
                  >
                    Open · 🪙 {pack.cost.toLocaleString()}
                  </button>
                </div>
              ))}
            </div>

            {packNotice ? (
              <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-xs font-bold text-amber-200">
                {packNotice}
              </div>
            ) : null}

            {openedCards ? (
              <div className="panel p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="eyebrow">
                      {walkout && (walkout.tier === "ICON" || walkout.tier === "HERO")
                        ? `✨ WALKOUT! ${walkout.tier} ${walkout.peakOvr} OVR — ${walkout.username}!`
                        : "PACK REVEAL"}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      Added to your RSL Club Binder
                    </h3>
                  </div>
                  {dupeRefund > 0 ? (
                    <span className="chip chip-amber">+{dupeRefund} Duplicate Quick-Sell Coins</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  {openedCards.map((card) => (
                    <FutCard key={card.id} player={card} size="md" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="panel p-10 text-center">
                <p className="text-3xl">🃏</p>
                <h3 className="mt-2 text-lg font-black text-white">Rip your first RSL pack</h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">
                  Every card features a real RSL player with their live Roblox avatar, peak sheet OVR, class badge and position-weighted attributes.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="panel p-5">
              <p className="eyebrow">CARD TIERS</p>
              <h3 className="mt-1 text-base font-black text-white">RSL Rarity Ladder</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                <li><strong className="text-amber-300">ICON:</strong> 93+ Peak OVR superstars &amp; multi-award legends</li>
                <li><strong className="text-orange-300">HERO:</strong> X-Class elites, Villareal S1 Champions &amp; award winners</li>
                <li><strong className="text-yellow-300">IN-FORM:</strong> S+ / S / S- Class standouts (87+ OVR)</li>
                <li><strong className="text-amber-100">RARE GOLD:</strong> A-Class competitors (82–86 OVR)</li>
                <li><strong className="text-slate-300">CLASSIC:</strong> Rising B &amp; C Class talents</li>
              </ul>
            </div>
            <MiniLeaderboard title="🃏 Draft Hall of Fame" scores={scores} unit="pts" />
          </div>
        </div>
      ) : null}

      {tab === "draft" ? (
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            {/* Draft progress header */}
            <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex flex-wrap gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Picks</p>
                  <p className="text-2xl font-black text-white">
                    {draftPicks.length}/{DRAFT_ROUNDS.length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Draft OVR</p>
                  <p className="text-2xl font-black text-amber-300">{draftSummary.ovr}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chemistry</p>
                  <p className="text-2xl font-black text-sky-300">⚡ {draftSummary.chem}/33</p>
                </div>
              </div>
              <button type="button" onClick={startNewDraft} className="btn btn-sm">
                ↻ Restart Draft
              </button>
            </div>

            {/* Active 5-card choice */}
            {draftPicks.length < DRAFT_ROUNDS.length ? (
              <div className="panel p-6">
                <p className="eyebrow">
                  ROUND {draftPicks.length + 1} OF {DRAFT_ROUNDS.length}
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Choose your {DRAFT_ROUNDS[draftPicks.length].slot}
                </h2>
                <div className="mt-5 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {draftChoices.map((card) => (
                    <FutCard
                      key={card.id}
                      player={card}
                      size="sm"
                      onClick={() => pickDraftCard(card)}
                      className="w-full max-w-[132px]"
                    />
                  ))}
                </div>
              </div>
            ) : !draftSim ? (
              <div className="euros-hero rounded-2xl p-6 text-center">
                <p className="eyebrow">SQUAD LOCKED IN</p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {draftSummary.ovr} OVR · ⚡ {draftSummary.chem}/33 Chemistry
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs text-slate-300">
                  Enter the 3-round EUROS Knockout Simulator with your drafted 6-man TCS squad to win up to 1,800 RSL Coins!
                </p>
                <button
                  type="button"
                  onClick={simulateDraftKnockout}
                  className="btn btn-primary mt-5 px-6 py-2.5 font-extrabold"
                >
                  ⚽ Kick Off EUROS Knockout Run →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="panel p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="eyebrow">TOURNAMENT RESULT</p>
                      <h2 className="mt-1 text-2xl font-black text-white">
                        {draftSim.champion
                          ? "🏆 EUROS DRAFT CHAMPIONS!"
                          : `Eliminated in ${draftSim.matches[draftSim.matches.length - 1]?.round}`}
                      </h2>
                    </div>
                    <span className="chip chip-amber">+🪙 {draftSim.reward} Coins Earned</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {draftSim.matches.map((m) => (
                      <div
                        key={m.round}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-xs",
                          m.won
                            ? "border-orange-400/35 bg-orange-500/10"
                            : "border-red-400/30 bg-red-500/10",
                        )}
                      >
                        <div className="flex items-center justify-between font-black text-white">
                          <span>
                            {m.round} · Your RSL VI vs {m.opponent}
                          </span>
                          <span className="font-mono text-sm">
                            {m.userGoals} – {m.oppGoals} {m.won ? "✔" : "✖"}
                          </span>
                        </div>
                        {m.scorers.length ? (
                          <p className="mt-1 text-[11px] text-slate-300">
                            ⚽ Scorers: {m.scorers.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-300">
                      Final Draft Score:{" "}
                      <strong className="font-mono text-base font-black text-orange-300">
                        {draftSim.draftScore} pts
                      </strong>
                    </p>
                    <button type="button" onClick={startNewDraft} className="btn btn-primary btn-sm">
                      Draft a new squad ↻
                    </button>
                  </div>
                </div>

                <ScoreSubmitBox
                  game="ultimate-team"
                  score={draftSim.draftScore}
                  detail={`${draftSummary.ovr} OVR · ${draftSummary.chem} Chem · ${draftSim.champion ? "EUROS Winner" : `${draftSim.matches.filter((m) => m.won).length}W`}`}
                  onSaved={(entry) =>
                    setScores((prev) => [entry, ...prev].sort((a, b) => b.score - a.score))
                  }
                />
              </div>
            )}

            {/* Drafted 6-man lineup preview */}
            <div className="panel p-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Your Drafted RSL VI
              </h3>
              <div className="mt-4 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 md:grid-cols-6">
                {DRAFT_ROUNDS.map((r, i) => {
                  const picked = draftPicks[i];
                  return picked ? (
                    <FutCard key={r.slot} player={picked} size="sm" subtitle={r.slot.split(" ")[0]} />
                  ) : (
                    <div
                      key={r.slot}
                      className="flex h-[150px] w-[112px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#081128] p-2 text-center"
                    >
                      <span className="text-xs font-black text-slate-500">Pick {i + 1}</span>
                      <span className="mt-1 text-[10px] text-slate-600">{r.slot}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <MiniLeaderboard title="🃏 Draft Hall of Fame" scores={scores} unit="pts" />
        </div>
      ) : null}

      {tab === "binder" ? (
        <div className="panel p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">COLLECTION PROGRESS</p>
              <h2 className="mt-1 text-xl font-black text-white">
                {ownedIds.length} of {players.length} RSL Cards Unlocked (
                {players.length ? Math.round((ownedIds.length / players.length) * 100) : 0}%)
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "ICON", "HERO", "TOTW", "GOLD", "SILVER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTierFilter(t)}
                  className={cn("btn btn-sm", tierFilter === t && "btn-primary")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {binderCards.length ? (
            <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {binderCards.map((card) => (
                <FutCard key={card.id} player={card} size="md" />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No cards unlocked in this tier yet — head to the Pack Store or EUROS Draft!
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
