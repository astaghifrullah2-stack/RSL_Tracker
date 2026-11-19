import { normalizeClass } from "@/lib/player-sheets";

export type ParsedSheetRow = {
  username: string;
  playerClass: string;
  rating: number | null;
  position: string | null;
  nation: string | null;
  teamName: string | null;
  role: string;
  wage: number | null;
  penalty: number | null;
  notes: string | null;
};

export type SheetImportLayout = "classFirst" | "usernameFirst";

export type SheetImportResult = {
  rows: ParsedSheetRow[];
  errors: string[];
};

const HEADER_ALIASES: Record<string, string[]> = {
  class: ["class", "tier", "player class"],
  rating: ["rating", "ovr", "overall", "rating (ovr)"],
  username: ["username", "player", "name", "roblox username", "roblox name"],
  userId: ["userid", "user id", "roblox id", "id", "owner", "owner id"],
  team: ["team", "team name", "club"],
  nation: ["nation", "nationality", "high rank", "country"],
  role: ["role", "staff role"],
  position: ["position", "pos"],
  wage: ["wage", "salary", "price", "value"],
  penalty: ["penalty", "fine", "release fee"],
  notes: ["notes", "note", "comment", "comments"],
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function headerKey(value: string) {
  const normalized = normalizeHeader(value);
  return Object.entries(HEADER_ALIASES).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null;
}

/** Parse one CSV line, including quoted cells and escaped double quotes. */
function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function money(value: string | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/\s/g, "").replace(/,/g, "").replace(/[^0-9.-]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
}

const CLASS_FIRST = ["class", "rating", "username", "team", "position", "role", "wage", "penalty", "notes"];
const USERNAME_FIRST = ["username", "team", "role", "wage", "penalty", "class", "rating", "position", "notes"];

/**
 * Parse pasted spreadsheet data. A header row is optional; without one, columns
 * follow the selected layout. Unknown teams are kept as free text so archives
 * can include clubs that no longer exist in the tracker.
 */
export function parseSheetImport(raw: string, layout: SheetImportLayout = "classFirst"): SheetImportResult {
  const errors: string[] = [];
  const byUsername = new Map<string, ParsedSheetRow>();
  const lines = raw.replace(/\r/g, "").split("\n");
  let headerMap: string[] | null = null;
  let dataStarted = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line) continue;
    const delimiter = line.includes("\t") ? "\t" : ",";
    const cells = parseDelimitedLine(line, delimiter);

    if (!dataStarted && !headerMap) {
      const possibleHeader = cells.map(headerKey);
      if (possibleHeader.includes("username")) {
        headerMap = possibleHeader.map((key, cellIndex) => key ?? `extra${cellIndex}`);
        dataStarted = true;
        continue;
      }
      headerMap = layout === "usernameFirst" ? USERNAME_FIRST : CLASS_FIRST;
    }
    dataStarted = true;

    const get = (key: string) => {
      const cellIndex = headerMap!.indexOf(key);
      return cellIndex >= 0 ? (cells[cellIndex] ?? "").trim() : "";
    };
    const username = get("username").replace(/^@/, "");
    if (!username) {
      errors.push(`Line ${index + 1}: missing a Roblox username.`);
      continue;
    }

    const notes = [get("notes"), ...cells.slice(headerMap!.length).filter(Boolean)].filter(Boolean).join(" · ") || null;
    const rating = money(get("rating"));
    const classText = get("class").trim();
    // Some sheets put the rating in the same cell as the class, e.g. "S+ 90".
    const inlineRating = classText.match(/^([A-Za-z]{1,2}[+-]{0,2})\s+(\d{1,3})$/);
    byUsername.set(username.toLowerCase(), {
      username,
      playerClass: normalizeClass(inlineRating ? inlineRating[1] : classText),
      rating: inlineRating ? Number(inlineRating[2]) : rating != null ? Math.min(99, rating) : null,
      position: get("position") ? get("position").toUpperCase() : null,
      nation: get("nation") || null,
      teamName: get("team") || null,
      role: (get("role") || "PLAYER").toUpperCase(),
      wage: money(get("wage")),
      penalty: money(get("penalty")),
      notes,
    });
  }

  if (byUsername.size > 1000) errors.push("A single import is limited to 1,000 players.");
  if (!byUsername.size && !errors.length) errors.push("Paste at least one spreadsheet row.");
  return { rows: [...byUsername.values()], errors };
}
