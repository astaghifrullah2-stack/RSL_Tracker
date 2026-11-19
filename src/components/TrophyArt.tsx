import { cn } from "@/lib/site";

export type TrophyArtKind =
  | "playerOfSeason"
  | "goldenBoot"
  | "playmaker"
  | "ballonDor"
  | "goldenBoy"
  | "goldenGlove"
  | "defensive"
  | "manager"
  | "puskas"
  | "referee"
  | "title"
  | "runnerUp"
  | "cup"
  | "league"
  | "default";

/** Maps an award/trophy name to its artwork, so images stay consistent site-wide. */
export function trophyArtKind(name: string, kind?: string): TrophyArtKind {
  const n = name.toLowerCase();
  if (/golden boot/.test(n)) return "goldenBoot";
  if (/playmaker|best playmaker|assist/.test(n)) return "playmaker";
  if (/ballon d'or|ballon dor/.test(n)) return "ballonDor";
  if (/golden boy/.test(n)) return "goldenBoy";
  if (/golden glove|goalkeeper of/.test(n)) return "goldenGlove";
  if (/defensive|defender of/.test(n)) return "defensive";
  if (/manager of/.test(n)) return "manager";
  if (/puskas/.test(n)) return "puskas";
  if (/referee/.test(n)) return "referee";
  if (/player of|most valuable|mvp/.test(n)) return "playerOfSeason";
  if (/runner|second|silver/.test(n)) return "runnerUp";
  if (/supercopa|supercoppa|cup|copa/.test(n)) return "cup";
  if (/liga|serie|league|division/.test(n)) return "league";
  return kind === "individual" ? "default" : "title";
}

const ORANGE = "#ff7518";
const GOLD = "#f5c639";
const BLUE = "#1756d6";
const RED = "#ed2f40";
const SILVER = "#dbe4f7";

type TrophyArtProps = { className?: string };

function Shield({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`g-${tone}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone} />
          <stop offset="100%" stopColor="#0a1530" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 56 11v22c0 15-11 24-24 28C19 57 8 48 8 33V11z"
        fill={`url(#g-${tone})`}
        stroke={tone}
        strokeWidth="2.5"
      />
      {children}
    </svg>
  );
}

const ART: Record<TrophyArtKind, (p: TrophyArtProps) => React.ReactElement> = {
  playerOfSeason: () => (
    <Shield tone={GOLD}>
      <circle cx="32" cy="24" r="9" fill="none" stroke="#0a1530" strokeWidth="2.5" />
      <path d="M20 44c2-7 7-9 12-9s10 2 12 9" fill="none" stroke="#0a1530" strokeWidth="2.5" />
      <path d="M32 33v14" stroke="#0a1530" strokeWidth="2" />
    </Shield>
  ),
  goldenBoot: () => (
    <Shield tone={GOLD}>
      <path d="M18 26h16l4 6 8 2-2 6H20z" fill="#0a1530" opacity=".85" />
      <path d="M44 40h4v6H18v-6h4" fill="#0a1530" opacity=".85" />
      <path d="M20 28l6-2m-4 6l6-2" stroke={GOLD} strokeWidth="2" />
    </Shield>
  ),
  playmaker: () => (
    <Shield tone={ORANGE}>
      <circle cx="32" cy="32" r="13" fill="none" stroke="#0a1530" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="4" fill="#0a1530" />
      <path d="M32 19v8m0 18v8m13-21h-8m-18 8h8" stroke="#0a1530" strokeWidth="2.5" />
    </Shield>
  ),
  ballonDor: () => (
    <Shield tone={GOLD}>
      <circle cx="32" cy="28" r="11" fill="#0a1530" opacity=".9" />
      <path d="M32 17v22M23 22l9 6 9-6M23 34l9-6 9 6" stroke={GOLD} strokeWidth="1.6" fill="none" />
      <path d="M28 44h8l1 8H27z" fill="#0a1530" opacity=".85" />
    </Shield>
  ),
  goldenBoy: () => (
    <Shield tone={BLUE}>
      <path d="M24 20h16l-3 6H27z" fill="#0a1530" opacity=".9" />
      <path d="M25 28h14v4c0 6-3 9-7 9s-7-3-7-9z" fill={GOLD} opacity=".95" />
      <path d="M28 44h8l1 8H27z" fill="#0a1530" opacity=".85" />
    </Shield>
  ),
  goldenGlove: () => (
    <Shield tone={GOLD}>
      <path d="M22 22c0-2 3-3 5-1l3 3V18c0-2 4-2 4 0v10l6-4c2-1 4 2 2 4l-8 8c-2 2-4 2-6 1l-5-3c-2-1-3-3-3-5z" fill="#0a1530" opacity=".9" />
      <path d="M24 46h16v3H24z" fill="#0a1530" opacity=".85" />
    </Shield>
  ),
  defensive: () => (
    <Shield tone={RED}>
      <path d="M32 16l12 5v10c0 9-6 15-12 17-6-2-12-8-12-17V21z" fill="#0a1530" opacity=".85" />
      <path d="M32 22l7 3v6c0 5-3 9-7 10-4-1-7-5-7-10v-6z" fill={RED} opacity=".9" />
    </Shield>
  ),
  manager: () => (
    <Shield tone={BLUE}>
      <path d="M20 26h24v6H20z" fill="#0a1530" opacity=".9" />
      <path d="M22 34h20l-3 12H25z" fill="#0a1530" opacity=".85" />
      <path d="M30 18h4v6h-4z" fill={SILVER} opacity=".8" />
    </Shield>
  ),
  puskas: () => (
    <Shield tone={GOLD}>
      <circle cx="32" cy="28" r="10" fill="#0a1530" opacity=".9" />
      <path d="M32 22l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill={GOLD} />
      <path d="M32 40v10M26 50h12" stroke="#0a1530" strokeWidth="2.5" />
    </Shield>
  ),
  referee: () => (
    <Shield tone={ORANGE}>
      <path d="M24 20l16 24M40 20L24 44" stroke="#0a1530" strokeWidth="3" />
      <circle cx="32" cy="32" r="6" fill="#0a1530" opacity=".9" />
      <circle cx="32" cy="32" r="2.5" fill={ORANGE} />
    </Shield>
  ),
  title: () => (
    <Shield tone={GOLD}>
      <path d="M20 20h24v6c0 8-5 13-12 16-7-3-12-8-12-16z" fill="#0a1530" opacity=".88" />
      <path d="M26 46h12l1 6H25z" fill="#0a1530" opacity=".85" />
      <path d="M26 26l4 4 8-8" stroke={GOLD} strokeWidth="2.5" fill="none" />
    </Shield>
  ),
  runnerUp: () => (
    <Shield tone={SILVER}>
      <path d="M20 20h24v6c0 8-5 13-12 16-7-3-12-8-12-16z" fill="#0a1530" opacity=".88" />
      <path d="M26 46h12l1 6H25z" fill="#0a1530" opacity=".85" />
      <text x="32" y="34" textAnchor="middle" fontSize="13" fontWeight="800" fill={SILVER}>2</text>
    </Shield>
  ),
  cup: () => (
    <Shield tone={ORANGE}>
      <path d="M22 20h20v5c0 8-4 12-10 15-6-3-10-7-10-15z" fill="#0a1530" opacity=".88" />
      <path d="M22 22h-5c0 6 2 9 6 10M42 22h5c0 6-2 9-6 10" stroke="#0a1530" strokeWidth="2.5" fill="none" />
      <path d="M27 42h10l1 6H26z" fill="#0a1530" opacity=".85" />
    </Shield>
  ),
  league: () => (
    <Shield tone={GOLD}>
      <path d="M32 16l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#0a1530" opacity=".88" />
      <path d="M32 22l2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill={GOLD} />
    </Shield>
  ),
  default: () => (
    <Shield tone={GOLD}>
      <path d="M26 18h12v6c0 6-2 9-6 11-4-2-6-5-6-11z" fill="#0a1530" opacity=".88" />
      <path d="M28 38h8l1 8H27z" fill="#0a1530" opacity=".85" />
      <path d="M30 24h4" stroke={GOLD} strokeWidth="2.5" />
    </Shield>
  ),
};

export function TrophyArt({
  name,
  kind,
  imageUrl,
  className,
}: {
  name: string;
  kind?: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} loading="lazy" className={cn("h-full w-full object-contain", className)} />
    );
  }
  const Art = ART[trophyArtKind(name, kind)];
  return <Art className={className} />;
}
