import Link from "next/link";
import { FutCard } from "@/components/play/FutCard";
import { MiniLeaderboard, PlaySubnav } from "@/components/play/PlayChrome";
import { Panel, StatCard } from "@/components/ui";
import { getArcadeDataset } from "@/lib/arcade-data";
import { formatWage } from "@/lib/player-sheets";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Games Hub · Play",
  description:
    "Play RSL Tic-Tac-Toe, Compare Players, Squad Builder, Ultimate Team and Higher or Lower with real RSL players and Roblox avatars.",
};

const GAME_CARDS = [
  {
    href: "/play/tic-tac-toe",
    eyebrow: "GRID PUZZLE • SOLO / 2P / VS BOT",
    title: "RSL Tic-Tac-Toe",
    description:
      "Connect 3 in a row on a guaranteed-solvable 3×3 RSL grid matching clubs, classes, wages, ratings, seasons and trophies.",
    tag: "Fan Favourite",
    accent: "from-orange-500/25 via-blue-600/15 to-transparent border-orange-400/35",
    icon: "⊞",
  },
  {
    href: "/play/ultimate-team",
    eyebrow: "PACKS • BINDER • EUROS DRAFT",
    title: "Ultimate Team",
    description:
      "Open Icon & X-Class packs, collect RSL player cards with live Roblox avatars, draft a 5-man squad and simulate an EUROS knockout run.",
    tag: "FUT Draft + Packs",
    accent: "from-amber-400/25 via-orange-500/15 to-transparent border-amber-400/35",
    icon: "🃏",
  },
  {
    href: "/play/squad-builder",
    eyebrow: "TCS 6V6 • 7V7 • 11V11 PITCH",
    title: "Squad Builder",
    description:
      "Build your dream TCS 6v6 or Full XI lineup with live club/class chemistry links, optional S4 wage-cap challenges and community publishing.",
    tag: "Community Showcase",
    accent: "from-blue-500/25 via-indigo-500/15 to-transparent border-blue-400/35",
    icon: "⚽",
  },
  {
    href: "/play/compare",
    eyebrow: "HEAD-TO-HEAD • 6-STAT RADAR",
    title: "Compare Players",
    description:
      "Put any two RSL players side-by-side: S2→S4 rating & wage trajectory, attribute hexagon radar, individual awards and verdict.",
    tag: "Scouting Lab",
    accent: "from-sky-400/20 via-blue-500/15 to-transparent border-sky-400/35",
    icon: "⚖️",
  },
  {
    href: "/play/higher-lower",
    eyebrow: "ARCADE STREAK • WAGES & OVR",
    title: "Higher or Lower",
    description:
      "Two RSL players step up face-to-face — guess if the challenger's peak wage or OVR rating is higher or lower before your streak snaps.",
    tag: "Streak Blitz",
    accent: "from-rose-500/25 via-amber-500/15 to-transparent border-rose-400/35",
    icon: "🔥",
  },
] as const;

export default async function PlayHubPage() {
  const { players, scores, squads } = await getArcadeDataset();
  const spotlight = players.slice(0, 3);
  const iconsCount = players.filter((p) => p.tier === "ICON" || p.tier === "HERO").length;

  const tttScores = scores.filter((s) => s.game === "tic-tac-toe");
  const utScores = scores.filter((s) => s.game === "ultimate-team");
  const hlScores = scores.filter((s) => s.game === "higher-lower");

  return (
    <>
      <PlaySubnav />

      <section className="euros-hero rounded-[26px] p-6 sm:p-9 lg:p-11">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/35 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.22em] text-orange-200">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_#ff7518]" />
              RSL ARCADE / INTERACTIVE MINI-GAMES
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Games <span className="text-orange-400">hub.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Five interactive football modes powered directly by real RSL players, Roblox avatars,
              S2–S4 playersheet ratings &amp; wages, championship squads, and trophies.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/play/tic-tac-toe"
                className="btn btn-primary border-orange-400/60 bg-orange-500 px-5 py-2.5 font-extrabold text-[#0d1226] hover:bg-orange-400"
              >
                Play RSL Tic-Tac-Toe ↗
              </Link>
              <Link href="/play/ultimate-team" className="btn px-5 py-2.5">
                Open Ultimate Team Packs →
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 [scrollbar-width:none]">
            {spotlight.map((p, idx) => (
              <Link
                key={p.id}
                href="/play/ultimate-team"
                className={idx === 1 ? "-translate-y-2 transition hover:-translate-y-3" : "opacity-95 transition hover:-translate-y-1"}
              >
                <FutCard player={p} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Playable RSL Cards" value={players.length} accent />
        <StatCard label="Icons & Heroes" value={iconsCount} />
        <StatCard label="Community Squads" value={squads.length} />
        <StatCard label="Arcade Records" value={scores.length} />
      </div>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-1.5">CHOOSE YOUR MODE</p>
            <h2 className="text-2xl font-black text-white">
              Play the league<span className="text-orange-400">.</span>
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GAME_CARDS.map((card, i) => (
            <Link
              key={card.href}
              href={card.href}
              className={`panel group relative flex flex-col justify-between overflow-hidden bg-gradient-to-br p-6 transition hover:-translate-y-1 hover:brightness-110 ${card.accent} ${
                i === 0 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">
                    {card.eyebrow}
                  </span>
                  <span className="chip chip-orange">{card.tag}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/30 text-xl">
                    {card.icon}
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-orange-200">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                  {card.description}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-extrabold text-orange-300">
                <span>Launch mode</span>
                <span className="transition group-hover:translate-x-1">Play now →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1.5">HALL OF FAME</p>
            <h2 className="text-2xl font-black text-white">
              Live leaderboards<span className="text-orange-400">.</span>
            </h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <MiniLeaderboard title="⊞ RSL Tic-Tac-Toe" scores={tttScores} unit="pts" />
          <MiniLeaderboard title="🃏 Ultimate Team Draft" scores={utScores} unit="pts" />
          <MiniLeaderboard title="🔥 Higher or Lower Streak" scores={hlScores} unit="streak" />
        </div>
      </section>

      <Panel
        className="mt-10"
        title="Community Dream Squads"
        description="Built and published by visitors in Squad Builder"
        action={
          <Link href="/play/squad-builder" className="btn btn-primary btn-sm">
            + Build a squad
          </Link>
        }
      >
        {squads.length ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {squads.slice(0, 6).map((sq) => (
              <Link
                key={sq.id}
                href={`/play/squad-builder?load=${sq.id}`}
                className="group rounded-2xl border border-white/10 bg-[#0a142e] p-4 transition hover:border-orange-400/45"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="chip chip-orange">{sq.mode} · {sq.formation}</span>
                  <span className="text-xs font-bold text-rose-300">♥ {sq.likes}</span>
                </div>
                <p className="mt-2.5 truncate text-base font-black text-white group-hover:text-orange-200">
                  {sq.title}
                </p>
                <p className="text-xs text-slate-400">by {sq.author}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-xs">
                  <span className="font-black text-amber-300">{sq.ovr} OVR</span>
                  <span className="font-bold text-sky-300">⚡ {sq.chemistry} Chem</span>
                  <span className="font-mono text-slate-400">{formatWage(sq.totalWage)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            No community squads published yet.{" "}
            <Link href="/play/squad-builder" className="font-bold text-orange-300 hover:underline">
              Open Squad Builder
            </Link>{" "}
            to publish the first dream TCS lineup!
          </div>
        )}
      </Panel>
    </>
  );
}
