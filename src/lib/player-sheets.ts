import { cache } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import {
  playerSheetRows,
  playerSheets,
  type PlayerSheet,
  type PlayerSheetRow,
} from "@/db/schema";
import { getLeagueData } from "@/lib/stats";

export type SheetData = {
  sheets: PlayerSheet[];
  rows: PlayerSheetRow[];
  rowsBySheet: Map<number, PlayerSheetRow[]>;
  current: PlayerSheet | null;
};

export const getPlayerSheets = cache(async (): Promise<SheetData> => {
  const [sheets, rows] = await Promise.all([
    db.select().from(playerSheets).orderBy(asc(playerSheets.sortOrder), asc(playerSheets.id)),
    db.select().from(playerSheetRows).orderBy(asc(playerSheetRows.sortOrder), asc(playerSheetRows.username)),
  ]);
  const rowsBySheet = new Map<number, PlayerSheetRow[]>();
  for (const row of rows) {
    const list = rowsBySheet.get(row.sheetId) ?? [];
    list.push(row);
    rowsBySheet.set(row.sheetId, list);
  }
  return {
    sheets,
    rows,
    rowsBySheet,
    current: sheets.find((s) => s.isCurrent) ?? sheets[sheets.length - 1] ?? null,
  };
});

export const CLASS_ORDER = [
  "X++",
  "X+",
  "X",
  "S+",
  "S",
  "S-",
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D",
  "UNRATED",
];

export function classRank(value: string) {
  const normalized = normalizeClass(value);
  const known = CLASS_ORDER.indexOf(normalized);
  return known === -1 ? CLASS_ORDER.length - 1 : known;
}

export function normalizeClass(value: string | null | undefined) {
  const clean = (value ?? "").trim().toUpperCase().replace(/\s+CLASS$/i, "");
  return clean || "UNRATED";
}

export function formatClass(value: string) {
  const clean = normalizeClass(value);
  return clean === "UNRATED" ? "UNRATED" : `${clean} CLASS`;
}

/** Collapse class variants into their family so S+, S and S- share one section. */
export function classFamily(value: string) {
  const clean = normalizeClass(value);
  if (clean === "UNRATED") return "UNRATED";
  return clean.replace(/[+-]+$/, "");
}

export function formatFamily(value: string) {
  const family = classFamily(value);
  return family === "UNRATED" ? "UNRATED" : `${family} CLASS`;
}

export function classShort(value: string) {
  const clean = normalizeClass(value);
  return clean === "UNRATED" ? "—" : clean;
}

export function formatWage(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.max(0, Math.trunc(value)).toLocaleString("en-US").replace(/,/g, " ")} $`;
}

export function sheetTabLabel(sheet: PlayerSheet) {
  const short = sheet.label.split(" ")[0] || sheet.slug.toUpperCase();
  return sheet.isCurrent ? `${short} · Current` : short;
}

export type SheetRowView = PlayerSheetRow & {
  teamLabel: string;
  profileHref: string | null;
  avatarUrl: string | null;
  robloxUserId: string | null;
  positionLabel: string;
  nationLabel: string;
};

export async function getSheetRowsView(sheetId: number): Promise<SheetRowView[]> {
  const [sheetData, league] = await Promise.all([getPlayerSheets(), getLeagueData()]);
  return (sheetData.rowsBySheet.get(sheetId) ?? []).map((row) => {
    const player = row.playerId ? league.playerById.get(row.playerId) : null;
    const team = row.teamId ? league.teamById.get(row.teamId) : null;
    const robloxUserId = row.robloxUserId ?? player?.robloxUserId ?? null;
    const avatarUrl =
      row.robloxAvatarUrl ??
      player?.robloxAvatarUrl ??
      (robloxUserId || row.username
        ? `/api/roblox/avatar-image?userId=${robloxUserId || ""}&username=${encodeURIComponent(row.username)}`
        : null);

    return {
      ...row,
      teamLabel: team?.name ?? row.teamName ?? "FREE AGENT",
      profileHref: player ? `/players/${player.id}` : null,
      avatarUrl,
      robloxUserId,
      positionLabel: row.position ?? player?.position ?? "—",
      nationLabel: row.nation ?? player?.nationality ?? "—",
    };
  });
}

export function filterSheetRows(
  rows: SheetRowView[],
  filters: { q?: string; className?: string; team?: string },
) {
  const q = filters.q?.trim().toLowerCase() ?? "";
  return rows.filter((row) => {
    if (filters.className) {
      const wanted = normalizeClass(filters.className);
      const actual = normalizeClass(row.playerClass);
      if (wanted !== actual && classFamily(wanted) !== classFamily(actual)) return false;
    }
    if (filters.team && filters.team !== row.teamLabel) return false;
    if (q) {
      const searchable = `${row.username} ${row.robloxUserId ?? ""} ${row.teamLabel} ${row.role} ${row.nationLabel} ${row.positionLabel} ${row.notes ?? ""}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}

export function groupSheetRows(rows: SheetRowView[]) {
  const groups = new Map<string, SheetRowView[]>();
  for (const row of rows) {
    const key = classFamily(row.playerClass);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => classRank(a) - classRank(b) || a.localeCompare(b))
    .map(([family, entries]) => ({
      family,
      className: family,
      rows: [...entries].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.username.localeCompare(b.username),
      ),
    }));
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function sheetRowsToCsv(rows: SheetRowView[]) {
  return [
    ["Class", "Rating", "Username", "Roblox ID", "Nation", "Position", "Team / Nation", "Role", "Wage", "Penalty", "Notes"].join(","),
    ...rows.map((row) =>
      [
        normalizeClass(row.playerClass),
        row.rating,
        row.username,
        row.robloxUserId,
        row.nationLabel === "—" ? "" : row.nationLabel,
        row.positionLabel === "—" ? "" : row.positionLabel,
        row.teamLabel,
        row.role,
        row.wage,
        row.penalty,
        row.notes,
      ].map(csvCell).join(","),
    ),
  ].join("\n");
}

const NATION_FLAGS: Record<string, string> = {
  netherlands: "🇳🇱", belgium: "🇧🇪", spain: "🇪🇸", portugal: "🇵🇹", italy: "🇮🇹",
  germany: "🇩🇪", england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", france: "🇫🇷", brazil: "🇧🇷", argentina: "🇦🇷",
  mexico: "🇲🇽", egypt: "🇪🇬", morocco: "🇲🇦", turkey: "🇹🇷", usa: "🇺🇸",
  "united states": "🇺🇸", canada: "🇨🇦", ireland: "🇮🇪", scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", nigeria: "🇳🇬", ghana: "🇬🇭", croatia: "🇭🇷", poland: "🇵🇱",
  japan: "🇯🇵", "south korea": "🇰🇷", australia: "🇦🇺", sweden: "🇸🇪", norway: "🇳🇴",
  denmark: "🇩🇰", finland: "🇫🇮", colombia: "🇨🇴", chile: "🇨🇱", uruguay: "🇺🇾",
  peru: "🇵🇪", ecuador: "🇪🇨", algeria: "🇩🇿", tunisia: "🇹🇳", senegal: "🇸🇳",
  "ivory coast": "🇨🇮", greece: "🇬🇷", romania: "🇷🇴", serbia: "🇷🇸", switzerland: "🇨🇭",
  austria: "🇦🇹", philippines: "🇵🇭", india: "🇮🇳", pakistan: "🇵🇰", indonesia: "🇮🇩",
  malaysia: "🇲🇾", "saudi arabia": "🇸🇦", qatar: "🇶🇦", jamaica: "🇯🇲",
};

/** Emoji flag for a nation name, or a neutral marker when unknown. */
export function nationFlag(nation: string | null | undefined) {
  if (!nation) return "";
  const key = nation.trim().toLowerCase();
  return NATION_FLAGS[key] ?? "";
}

export function ratingRange(rows: Array<{ rating: number | null }>) {
  const values = rows.map((row) => row.rating).filter((value): value is number => value != null);
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}` : `${min}–${max}`;
}

export type PlayerSheetHistoryEntry = {
  sheetLabel: string;
  sheetSlug: string;
  sheetSeason: string;
  playerClass: string;
  rating: number | null;
  wage: number | null;
  position: string | null;
  nation: string | null;
  role: string;
};

/** Every playersheet appearance for one player, newest season first. */
export async function getPlayerSheetHistory(playerId: number): Promise<PlayerSheetHistoryEntry[]> {
  const sheets = await getPlayerSheets();
  return sheets.rows
    .filter((row) => row.playerId === playerId)
    .map((row) => {
      const sheet = sheets.sheets.find((item) => item.id === row.sheetId);
      return {
        sheetLabel: sheet?.label ?? "Playersheet",
        sheetSlug: sheet?.slug ?? "",
        sheetSeason: sheet?.season ?? "",
        playerClass: row.playerClass,
        rating: row.rating,
        wage: row.wage,
        position: row.position,
        nation: row.nation,
        role: row.role,
      };
    })
    .sort((a, b) => b.sheetSeason.localeCompare(a.sheetSeason));
}
