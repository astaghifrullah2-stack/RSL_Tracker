import type { Competition, Player, Position, Team } from "@/db/schema";

// ---------------------------------------------------------------------------
// Brand & season chapters
// ---------------------------------------------------------------------------
export const site = {
  short: "RSL",
  name: "RSL Tracker",
  tagline: "ROBLOXIAN SPANISH LEAGUE",
  description:
    "The home of the Robloxian Spanish League. Four seasons, three club eras, and a new international chapter: the EUROS.",
  footerNote: "Every season. Every story. On the record.",
};

export const seasons = [
  { season: "Season 1", number: "01", era: "Spanish League", subtitle: "Where the story began", accent: "#f2bd43" },
  { season: "Season 2", number: "02", era: "Spanish League", subtitle: "The Iberian chapter", accent: "#e76b53" },
  { season: "Season 3", number: "03", era: "Italian League", subtitle: "A new kind of rivalry", accent: "#75afd8" },
  { season: "Season 4", number: "04", era: "EUROS", subtitle: "Netherlands × Belgium", accent: "#ff7518" },
] as const;

export const currentSeason = "Season 4";

export function seasonInfo(season: string | null | undefined) {
  return seasons.find((s) => s.season === season);
}

export type NavLink = {
  href: string;
  label: string;
  /** Hidden on medium screens to keep the header from overflowing. */
  wide?: boolean;
  /** Gets a subtle violet accent (new sections). */
  highlight?: boolean;
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/archive", label: "Archive" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/sheets", label: "Sheets" },
  { href: "/transfers", label: "Transfers" },
  { href: "/matches", label: "Matches" },
  { href: "/stats", label: "Stats" },
  { href: "/rankings", label: "Rankings", highlight: true },
  { href: "/records", label: "Records", wide: true },
];

export const playMenuLinks = [
  { href: "/play", label: "Games hub", badge: "ARCADE" },
  { href: "/play/tic-tac-toe", label: "RSL Tic-Tac-Toe" },
  { href: "/play/compare", label: "Compare players" },
  { href: "/play/squad-builder", label: "Squad builder" },
  { href: "/play/ultimate-team", label: "Ultimate Team" },
  { href: "/play/higher-lower", label: "Higher or Lower", badge: "NEW" },
] as const;

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
export const positionNames: Record<Position, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

export const competitionTypeLabels: Record<Competition["type"], string> = {
  league: "League",
  cup: "Cup",
  tournament: "Tournament",
  friendly: "Friendly",
};

export const competitionStatusLabels: Record<Competition["status"], string> = {
  upcoming: "Upcoming",
  ongoing: "Current season",
  completed: "Archived",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function playerLabel(p: Pick<Player, "name" | "displayName"> | undefined | null) {
  if (!p) return "Unknown player";
  return p.displayName?.trim() ? p.displayName : p.name;
}

export function teamLabel(t: Pick<Team, "name"> | undefined | null) {
  return t?.name ?? "Unknown team";
}

export function competitionLabel(c: Pick<Competition, "name" | "season"> | undefined | null) {
  if (!c) return "Unknown competition";
  return c.season ? `${c.name} · ${c.season}` : c.name;
}

export function initials(name: string) {
  const parts = name.replace(/[_\-.]/g, " ").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "TBD";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "Date TBD";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "Date TBD";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a Date for an <input type="datetime-local"> value. */
export function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ratio(num: number, den: number, digits = 2) {
  if (!den) return "0.00";
  return (num / den).toFixed(digits);
}

export function pct(num: number, den: number) {
  if (!den) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

export function plural(n: number, one: string, many?: string) {
  return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

export function formatWage(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.max(0, Math.trunc(value)).toLocaleString("en-US").replace(/,/g, " ")} $`;
}
