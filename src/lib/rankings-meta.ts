import type { ArcadePlayer, CardTier } from "@/lib/arcade-data";

export const RANKING_SCOPES = ["all", "s1", "s2", "s3", "s4"] as const;
export type RankingScope = (typeof RANKING_SCOPES)[number];

export const BOARD_IDS = [
  "index",
  "goals",
  "assists",
  "cleanSheets",
  "motm",
  "rating",
  "wage",
  "trophies",
  "titles",
  "seasons",
] as const;
export type BoardId = (typeof BOARD_IDS)[number];

export type BoardFormat = "number" | "wage" | "ovr" | "index" | "seasons";

export const BOARD_META: Record<
  BoardId,
  {
    label: string;
    short: string;
    icon: string;
    group: "match" | "archive";
    unit: string;
    format: BoardFormat;
    tagline: string;
    sourceNote: string;
    description: string;
    accent: string;
  }
> = {
  index: {
    label: "RSL Index",
    short: "RSL INDEX",
    icon: "⚡",
    group: "archive",
    unit: "RSL INDEX",
    format: "index",
    tagline: "The complete career ladder. Every era combined.",
    sourceNote: "Composite index from sheet OVR, honours, titles & recorded matches.",
    description:
      "Composite rating blending peak playersheet OVR, individual awards, championship titles, seasons on record, wages and recorded match output.",
    accent: "#ff7518",
  },
  goals: {
    label: "Goals",
    short: "GOALS",
    icon: "⚽",
    group: "match",
    unit: "GOALS",
    format: "number",
    tagline: "The finishers. The difference-makers.",
    sourceNote: "Goals credited to players in recorded RSL matches.",
    description: "Career goals from recorded matches. Updates instantly when a scorer is logged in Admin.",
    accent: "#ff7518",
  },
  assists: {
    label: "Assists",
    short: "ASSISTS",
    icon: "🎯",
    group: "match",
    unit: "ASSISTS",
    format: "number",
    tagline: "The creators. The visionaries.",
    sourceNote: "Assists credited on goals in recorded RSL matches.",
    description: "Assists credited on recorded goals.",
    accent: "#38bdf8",
  },
  cleanSheets: {
    label: "Clean sheets",
    short: "CLEAN SHEETS",
    icon: "🧤",
    group: "match",
    unit: "CLEAN SHEETS",
    format: "number",
    tagline: "The guardians. The shutout kings.",
    sourceNote: "Zero-conceded appearances by goalkeepers in recorded matches.",
    description: "Matches where the goalkeeper's side conceded zero.",
    accent: "#34d399",
  },
  motm: {
    label: "MOTMs",
    short: "MOTMS",
    icon: "✦",
    group: "match",
    unit: "MOTMS",
    format: "number",
    tagline: "The clutch performers. Big-game icons.",
    sourceNote: "Man of the Match honours awarded on official fixtures.",
    description: "Man of the Match awards recorded on fixtures.",
    accent: "#facc15",
  },
  rating: {
    label: "Sheet OVR",
    short: "SHEET OVR",
    icon: "★",
    group: "archive",
    unit: "OVR",
    format: "ovr",
    tagline: "Rated talent from the official playersheets.",
    sourceNote: "Peak overall rating across the S2–S4 playersheets.",
    description: "Highest overall rating recorded on the S2–S4 playersheets.",
    accent: "#a855f7",
  },
  wage: {
    label: "Peak wage",
    short: "WAGE",
    icon: "💎",
    group: "archive",
    unit: "WAGE",
    format: "wage",
    tagline: "Market value. Highest sheet contracts.",
    sourceNote: "Highest season wage recorded on S2–S4 playersheets.",
    description: "Highest season wage on a playersheet. A measure of how highly the league valued a player.",
    accent: "#fbbf24",
  },
  trophies: {
    label: "Honours",
    short: "HONOURS",
    icon: "🏆",
    group: "archive",
    unit: "HONOURS",
    format: "number",
    tagline: "Silverware collectors. Individual & club glory.",
    sourceNote: "Official individual awards plus championship titles won.",
    description: "Individual awards plus competition titles won with championship squads.",
    accent: "#f5c431",
  },
  titles: {
    label: "Championships",
    short: "TITLES",
    icon: "🥇",
    group: "archive",
    unit: "TITLES",
    format: "number",
    tagline: "Proven winners. Trophy-lifting squads.",
    sourceNote: "Titles won with Villareal S1, Real Madrid S2, AC Milan & Como S3.",
    description: "Official competition wins from recorded season-winning squads.",
    accent: "#ff7518",
  },
  seasons: {
    label: "Seasons",
    short: "SEASONS",
    icon: "📅",
    group: "archive",
    unit: "SEASONS",
    format: "seasons",
    tagline: "The veterans. Longevity on record.",
    sourceNote: "Distinct RSL seasons (S1–S4) a player appears on the record.",
    description: "Distinct seasons (S1–S4) a player appears on the official record.",
    accent: "#a78bfa",
  },
};

export const SCOPE_META: Record<RankingScope, { label: string; short: string; season: string | null }> = {
  all: { label: "All-time (every season)", short: "All-time", season: null },
  s1: { label: "Season 1 · Spanish League", short: "S1", season: "Season 1" },
  s2: { label: "Season 2 · Spanish League", short: "S2", season: "Season 2" },
  s3: { label: "Season 3 · Italian League", short: "S3", season: "Season 3" },
  s4: { label: "Season 4 · EUROS", short: "S4", season: "Season 4" },
};

export function boardKey(scope: RankingScope, board: BoardId) {
  return `${scope}:${board}`;
}

export type RankingRow = {
  playerId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  robloxUserId: string | null;
  position: string;
  detailedPosition: string;
  currentTeam: string;
  primaryClub: string;
  clubs: string[];
  seasons: string[];
  seasonsCount: number;
  tier: CardTier;
  peakClass: string;
  peakOvr: number;
  values: Record<RankingScope, Record<BoardId, number | null>>;
  card: ArcadePlayer;
};

export type RankingEntry = { playerId: number; rank: number; value: number };

export type ClubPowerRow = {
  club: string;
  short: string;
  color: string;
  players: number;
  avgIndex: number;
  totalIndex: number;
  titles: number;
  best: { name: string; avatarUrl: string; index: number } | null;
};

export type SeasonSummary = {
  scope: RankingScope;
  label: string;
  era: string;
  ranked: number;
  avgOvr: number | null;
  highestOvr: { name: string; avatarUrl: string; value: number } | null;
  highestWage: { name: string; avatarUrl: string; value: number } | null;
  champions: string[];
  topFive: Array<{ name: string; avatarUrl: string; value: number; club: string }>;
};

export type RankingsData = {
  rows: RankingRow[];
  byPlayer: Record<number, RankingRow>;
  rankings: Record<string, RankingEntry[]>;
  clubs: ClubPowerRow[];
  seasonSummaries: SeasonSummary[];
  totals: {
    players: number;
    clubs: number;
    honours: number;
    titles: number;
    goals: number;
    matches: number;
    ratedEntries: number;
  };
};

export type RankingsView = "leaderboards" | "top25" | "clubs" | "seasons" | "databank";

export const RANKINGS_VIEWS: Array<{ id: RankingsView; label: string; icon?: string }> = [
  { id: "leaderboards", label: "Leaderboards" },
  { id: "top25", label: "Top 25", icon: "⭐" },
  { id: "clubs", label: "Club Power", icon: "🏟️" },
  { id: "seasons", label: "Season Lab", icon: "🧪" },
  { id: "databank", label: "Databank", icon: "🗄️" },
];

export function formatBoardValue(value: number, format: BoardFormat) {
  if (format === "wage") return `${value.toLocaleString("en-US").replace(/,/g, " ")} $`;
  if (format === "ovr") return `${value} OVR`;
  if (format === "index") return `${value}`;
  if (format === "seasons") return `${value} ${value === 1 ? "season" : "seasons"}`;
  return `${value}`;
}
