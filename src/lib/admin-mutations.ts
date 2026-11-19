import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  COMPETITION_STATUSES,
  COMPETITION_TYPES,
  MATCH_STATUSES,
  POSITIONS,
  SITE_CONTENT_KINDS,
  TROPHY_KINDS,
  appearances,
  competitionEntrants,
  competitionPlacements,
  competitions,
  goals,
  matches,
  playerSheetRows,
  playerSheets,
  players,
  siteContent,
  teamSeasonRosters,
  teams,
  trophies,
} from "@/db/schema";
import type { AdminActionName } from "@/lib/admin-action-names";
import { normalizeClass } from "@/lib/player-sheets";
import { resolveRobloxUser, resolveRobloxUsers } from "@/lib/roblox";
import { clearAllData, seedArchiveData } from "@/lib/seed";
import { parseSheetImport, type SheetImportLayout } from "@/lib/sheet-import";

export type MutationResult =
  | { ok: true; message: string; redirectTo: string }
  | { ok: false; error: string; redirectTo?: string };

// ---------------------------------------------------------------------------
// FormData helpers
// ---------------------------------------------------------------------------
const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const imagePath = (fd: FormData, k: string) => {
  const value = str(fd, k);
  return value.startsWith("/") && !value.startsWith("//")
    ? value
    : /^https:\/\//i.test(value)
      ? value
      : null;
};
const safeHttpUrl = (fd: FormData, key: string) => {
  const value = str(fd, key);
  return /^https?:\/\//i.test(value) ? value : null;
};
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const textId = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(/\D/g, "");
  return v || null;
};
const int = (fd: FormData, k: string, fallback = 0) => {
  const n = num(fd, k);
  return n == null ? fallback : Math.trunc(n);
};
const nullableNonNegativeInt = (fd: FormData, key: string) => {
  if (!str(fd, key)) return null;
  const value = int(fd, key, -1);
  return value >= 0 ? value : null;
};
const bool = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return v === "on" || v === "true" || v === "1";
};
const dateTime = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const dateOnly = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
function oneOf<const T extends readonly string[]>(
  fd: FormData,
  k: string,
  allowed: T,
  fallback: T[number],
): T[number] {
  const v = str(fd, k);
  return (allowed as readonly string[]).includes(v) ? (v as T[number]) : fallback;
}

function ok(path: string, message: string): MutationResult {
  revalidatePath("/", "layout");
  const sep = path.includes("?") ? "&" : "?";
  return {
    ok: true,
    message,
    redirectTo: `${path}${sep}ok=${encodeURIComponent(message)}`,
  };
}

function fail(path: string, error: string): MutationResult {
  const sep = path.includes("?") ? "&" : "?";
  return {
    ok: false,
    error,
    redirectTo: `${path}${sep}error=${encodeURIComponent(error)}`,
  };
}

// ---------------------------------------------------------------------------
// Teams & Players helpers
// ---------------------------------------------------------------------------
function teamValues(fd: FormData) {
  return {
    name: str(fd, "name"),
    shortName: str(fd, "shortName").toUpperCase().slice(0, 6),
    kind: oneOf(fd, "kind", ["club", "nation"] as const, "club"),
    badgeUrl: imagePath(fd, "badgeUrl"),
    primaryColor: str(fd, "primaryColor") || "#ff7518",
    secondaryColor: str(fd, "secondaryColor") || "#10245c",
    manager: opt(fd, "manager"),
    founded: opt(fd, "founded"),
    description: opt(fd, "description"),
  };
}

function playerValues(fd: FormData) {
  return {
    name: str(fd, "name"),
    displayName: opt(fd, "displayName"),
    teamId: num(fd, "teamId"),
    position: oneOf(fd, "position", POSITIONS, "MID"),
    number: num(fd, "number"),
    nationality: opt(fd, "nationality"),
    bio: opt(fd, "bio"),
    isActive: bool(fd, "isActive"),
    robloxUserId: textId(fd, "robloxUserId"),
    robloxAvatarUrl: opt(fd, "robloxAvatarUrl"),
  };
}

function competitionValues(fd: FormData) {
  return {
    name: str(fd, "name"),
    badgeUrl: imagePath(fd, "badgeUrl"),
    type: oneOf(fd, "type", COMPETITION_TYPES, "league"),
    season: opt(fd, "season"),
    status: oneOf(fd, "status", COMPETITION_STATUSES, "upcoming"),
    startDate: dateOnly(fd, "startDate"),
    endDate: dateOnly(fd, "endDate"),
    description: opt(fd, "description"),
  };
}

function matchValues(fd: FormData) {
  return {
    competitionId: int(fd, "competitionId"),
    homeTeamId: int(fd, "homeTeamId"),
    awayTeamId: int(fd, "awayTeamId"),
    homeScore: Math.max(0, int(fd, "homeScore")),
    awayScore: Math.max(0, int(fd, "awayScore")),
    status: oneOf(fd, "status", MATCH_STATUSES, "scheduled"),
    playedAt: dateTime(fd, "playedAt"),
    round: opt(fd, "round"),
    venue: opt(fd, "venue"),
    notes: opt(fd, "notes"),
    motmPlayerId: num(fd, "motmPlayerId"),
  };
}

async function syncScoreInternal(matchId: number) {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!m) return;
  const gs = await db.select().from(goals).where(eq(goals.matchId, matchId));
  const homeScore = gs.filter((g) => g.teamId === m.homeTeamId).length;
  const awayScore = gs.filter((g) => g.teamId === m.awayTeamId).length;
  await db.update(matches).set({ homeScore, awayScore }).where(eq(matches.id, matchId));
}

function contentValues(fd: FormData) {
  return {
    kind: oneOf(fd, "kind", SITE_CONTENT_KINDS, "gfx"),
    title: str(fd, "title"),
    imageUrl: imagePath(fd, "imageUrl"),
    linkUrl: opt(fd, "linkUrl"),
    caption: opt(fd, "caption"),
    season: opt(fd, "season"),
    sortOrder: int(fd, "sortOrder"),
    isActive: bool(fd, "isActive"),
  };
}

function sheetValues(fd: FormData) {
  const slug = str(fd, "slug").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
  const seasonNumber = Number(slug.match(/\d+/)?.[0]);
  return {
    slug,
    label: str(fd, "label"),
    season: str(fd, "season"),
    description: opt(fd, "description"),
    sourceUrl: safeHttpUrl(fd, "sourceUrl"),
    isCurrent: bool(fd, "isCurrent"),
    isVerified: bool(fd, "isVerified"),
    sortOrder: int(fd, "sortOrder", Number.isFinite(seasonNumber) ? seasonNumber : 0),
  };
}

function sheetRowValues(fd: FormData) {
  const teamId = nullableNonNegativeInt(fd, "teamId");
  return {
    username: str(fd, "username").replace(/^@/, ""),
    playerId: nullableNonNegativeInt(fd, "playerId"),
    teamId,
    teamName: teamId ? null : opt(fd, "teamName"),
    role: (str(fd, "role") || "PLAYER").toUpperCase(),
    playerClass: normalizeClass(str(fd, "playerClass")),
    rating: (() => {
      const value = nullableNonNegativeInt(fd, "rating");
      return value == null ? null : Math.max(0, Math.min(99, value));
    })(),
    position: opt(fd, "position")?.toUpperCase() ?? null,
    nation: opt(fd, "nation"),
    wage: nullableNonNegativeInt(fd, "wage"),
    penalty: nullableNonNegativeInt(fd, "penalty"),
    notes: opt(fd, "notes"),
    sortOrder: int(fd, "sortOrder"),
  };
}

async function linkUsernameToPlayer(values: ReturnType<typeof sheetRowValues>) {
  if (values.playerId || !values.username) return;
  const roster = await db.select({ id: players.id, name: players.name }).from(players);
  values.playerId =
    roster.find((player) => player.name.toLowerCase() === values.username.toLowerCase())?.id ?? null;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export async function executeAdminMutation(
  action: AdminActionName,
  fd: FormData,
): Promise<MutationResult> {
  switch (action) {
    // ---- Teams ----
    case "createTeam": {
      const v = teamValues(fd);
      if (!v.name || !v.shortName) return fail("/admin/teams", "Team name and abbreviation are required.");
      await db.insert(teams).values(v);
      return ok("/admin/teams", `${v.name} created.`);
    }
    case "updateTeam": {
      const id = int(fd, "id");
      const v = teamValues(fd);
      if (!v.name || !v.shortName) return fail(`/admin/teams/${id}`, "Team name and abbreviation are required.");
      await db.update(teams).set(v).where(eq(teams.id, id));
      return ok(`/admin/teams/${id}`, "Team saved.");
    }
    case "deleteTeam": {
      const id = int(fd, "id");
      await db.delete(teams).where(eq(teams.id, id));
      return ok("/admin/teams", "Team deleted.");
    }
    case "addSeasonRosterPlayer": {
      const teamId = int(fd, "teamId");
      const playerId = int(fd, "playerId");
      const season = str(fd, "season") || "Season 1";
      const label = str(fd, "label") || `${season} Winners`;
      const discordHandle = opt(fd, "discordHandle");
      const path = `/admin/teams/${teamId}`;
      if (!teamId || !playerId) return fail(path, "Select a player to add to the season squad.");
      const existing = await db
        .select({ id: teamSeasonRosters.id })
        .from(teamSeasonRosters)
        .where(and(eq(teamSeasonRosters.teamId, teamId), eq(teamSeasonRosters.season, season)));
      await db
        .insert(teamSeasonRosters)
        .values({
          teamId,
          playerId,
          season,
          label,
          discordHandle,
          sortOrder: existing.length + 1,
        })
        .onConflictDoNothing();
      return ok(path, "Player added to season squad.");
    }
    case "removeSeasonRosterPlayer": {
      const id = int(fd, "id");
      const teamId = int(fd, "teamId");
      await db.delete(teamSeasonRosters).where(eq(teamSeasonRosters.id, id));
      return ok(`/admin/teams/${teamId}`, "Player removed from season squad.");
    }

    // ---- Players & Roblox ----
    case "createPlayer": {
      const v = playerValues(fd);
      if (!v.name) return fail("/admin/players", "Roblox username is required.");
      if (!v.robloxUserId || !v.robloxAvatarUrl) {
        const identity = await resolveRobloxUser(v.name);
        if (identity) {
          v.robloxUserId = v.robloxUserId ?? (identity.userId != null ? String(identity.userId) : null);
          v.robloxAvatarUrl = v.robloxAvatarUrl ?? identity.headshotUrl;
        }
      }
      await db.insert(players).values(v);
      return ok("/admin/players", `${v.name} added.`);
    }
    case "updatePlayer": {
      const id = int(fd, "id");
      const v = playerValues(fd);
      if (!v.name) return fail(`/admin/players/${id}`, "Roblox username is required.");
      // Preserve existing cached avatar unless explicitly overridden
      const [existing] = await db.select().from(players).where(eq(players.id, id));
      await db
        .update(players)
        .set({
          ...v,
          robloxAvatarUrl: v.robloxAvatarUrl ?? existing?.robloxAvatarUrl ?? null,
          robloxUserId: v.robloxUserId ?? existing?.robloxUserId ?? null,
        })
        .where(eq(players.id, id));
      return ok(`/admin/players/${id}`, "Player saved.");
    }
    case "deletePlayer": {
      const id = int(fd, "id");
      await db.delete(players).where(eq(players.id, id));
      return ok("/admin/players", "Player deleted.");
    }
    case "resolvePlayerRoblox": {
      const id = int(fd, "id");
      const path = `/admin/players/${id}`;
      const [player] = await db.select().from(players).where(eq(players.id, id));
      if (!player) return fail(path, "Player not found.");
      const identity = await resolveRobloxUser(player.name);
      if (!identity) {
        await db
          .update(players)
          .set({ robloxUserId: null, robloxAvatarUrl: null, robloxVerified: false })
          .where(eq(players.id, id));
        return fail(path, `No Roblox account found for ${player.name}.`);
      }
      await db
        .update(players)
        .set({
          robloxUserId: identity.userId != null ? String(identity.userId) : null,
          robloxAvatarUrl: identity.headshotUrl,
          robloxVerified: identity.verified,
          displayName: player.displayName?.trim() ? player.displayName : identity.displayName,
        })
        .where(eq(players.id, id));
      return ok(path, `Roblox profile linked for ${player.name}.`);
    }
    case "syncAllRobloxAvatars": {
      const roster = await db.select({ id: players.id, name: players.name }).from(players);
      if (!roster.length) return fail("/admin/players", "No players to sync.");
      for (let i = 0; i < roster.length; i += 100) {
        const chunk = roster.slice(i, i + 100);
        const identities = await resolveRobloxUsers(chunk.map((r) => r.name));
        for (const row of chunk) {
          const identity = identities.get(row.name);
          if (!identity || !identity.resolved) continue;
          await db
            .update(players)
            .set({
              robloxUserId: identity.userId != null ? String(identity.userId) : null,
              robloxAvatarUrl: identity.headshotUrl,
              robloxVerified: identity.verified,
            })
            .where(eq(players.id, row.id));
        }
      }
      return ok("/admin/players", `Roblox avatars synced for ${roster.length} players.`);
    }

    // ---- Competitions ----
    case "createCompetition": {
      const v = competitionValues(fd);
      if (!v.name) return fail("/admin/competitions", "Competition name is required.");
      await db.insert(competitions).values(v);
      return ok("/admin/competitions", `${v.name} created.`);
    }
    case "updateCompetition": {
      const id = int(fd, "id");
      const v = competitionValues(fd);
      if (!v.name) return fail(`/admin/competitions/${id}`, "Competition name is required.");
      await db.update(competitions).set(v).where(eq(competitions.id, id));
      return ok(`/admin/competitions/${id}`, "Competition saved.");
    }
    case "deleteCompetition": {
      const id = int(fd, "id");
      await db.delete(trophies).where(eq(trophies.competitionId, id));
      await db.delete(competitions).where(eq(competitions.id, id));
      return ok("/admin/competitions", "Competition deleted (including its matches and honours).");
    }
    case "addCompetitionEntrant": {
      const competitionId = int(fd, "competitionId");
      const teamId = int(fd, "teamId");
      const path = `/admin/competitions/${competitionId}`;
      if (!competitionId || !teamId) return fail(path, "Select a team to add.");
      await db.insert(competitionEntrants).values({ competitionId, teamId }).onConflictDoNothing();
      return ok(path, "Team added to the competition.");
    }
    case "removeCompetitionEntrant": {
      const competitionId = int(fd, "competitionId");
      const teamId = int(fd, "teamId");
      await db
        .delete(competitionEntrants)
        .where(
          and(
            eq(competitionEntrants.competitionId, competitionId),
            eq(competitionEntrants.teamId, teamId),
          ),
        );
      return ok(`/admin/competitions/${competitionId}`, "Team removed from entrants.");
    }
    case "setCompetitionPodium": {
      const competitionId = int(fd, "competitionId");
      const championId = num(fd, "championId");
      const runnerUpId = num(fd, "runnerUpId");
      const path = `/admin/competitions/${competitionId}`;
      if (championId && championId === runnerUpId) {
        return fail(path, "Champion and runner-up must be different teams.");
      }
      const [competition] = await db
        .select()
        .from(competitions)
        .where(eq(competitions.id, competitionId));
      if (!competition) return fail("/admin/competitions", "Competition not found.");

      await db.transaction(async (tx) => {
        await tx
          .delete(competitionPlacements)
          .where(eq(competitionPlacements.competitionId, competitionId));
        const rows = [
          ...(championId ? [{ competitionId, teamId: championId, placement: 1 }] : []),
          ...(runnerUpId ? [{ competitionId, teamId: runnerUpId, placement: 2 }] : []),
        ];
        if (rows.length) await tx.insert(competitionPlacements).values(rows);
        for (const row of rows) {
          await tx
            .insert(competitionEntrants)
            .values({ competitionId, teamId: row.teamId })
            .onConflictDoNothing();
        }

        const awardName = `${competition.name} Winners`;
        const [award] = await tx
          .select()
          .from(trophies)
          .where(
            and(
              eq(trophies.competitionId, competitionId),
              eq(trophies.name, awardName),
              eq(trophies.kind, "team"),
            ),
          );
        if (championId) {
          if (award) {
            await tx
              .update(trophies)
              .set({ teamId: championId, season: competition.season })
              .where(eq(trophies.id, award.id));
          } else {
            await tx.insert(trophies).values({
              name: awardName,
              kind: "team",
              teamId: championId,
              competitionId,
              season: competition.season,
              icon: "🏆",
            });
          }
        } else if (award) {
          await tx.delete(trophies).where(eq(trophies.id, award.id));
        }
      });
      return ok(path, "Competition podium updated.");
    }

    // ---- Matches, Lineups & Goals ----
    case "createMatch": {
      const v = matchValues(fd);
      if (!v.competitionId || !v.homeTeamId || !v.awayTeamId) {
        return fail("/admin/matches", "Competition, home team and away team are required.");
      }
      if (v.homeTeamId === v.awayTeamId) {
        return fail("/admin/matches", "A team cannot play itself.");
      }
      const [row] = await db.insert(matches).values(v).returning({ id: matches.id });
      return ok(`/admin/matches/${row.id}`, "Match created. Now add the lineups and goals.");
    }
    case "updateMatch": {
      const id = int(fd, "id");
      const v = matchValues(fd);
      if (!v.competitionId || !v.homeTeamId || !v.awayTeamId) {
        return fail(`/admin/matches/${id}`, "Competition, home team and away team are required.");
      }
      if (v.homeTeamId === v.awayTeamId) {
        return fail(`/admin/matches/${id}`, "A team cannot play itself.");
      }
      await db.update(matches).set(v).where(eq(matches.id, id));
      return ok(`/admin/matches/${id}`, "Match saved.");
    }
    case "deleteMatch": {
      const id = int(fd, "id");
      await db.delete(matches).where(eq(matches.id, id));
      return ok("/admin/matches", "Match deleted.");
    }
    case "saveLineup": {
      const matchId = int(fd, "matchId");
      const teamId = int(fd, "teamId");
      const rows: Array<typeof appearances.$inferInsert> = [];
      for (const [key] of fd.entries()) {
        if (!key.startsWith("played_")) continue;
        const playerId = Number(key.slice("played_".length));
        if (!Number.isFinite(playerId)) continue;
        rows.push({
          matchId,
          teamId,
          playerId,
          position: oneOf(fd, `pos_${playerId}`, POSITIONS, "MID"),
          yellowCards: Math.max(0, Math.min(2, int(fd, `yc_${playerId}`))),
          redCard: bool(fd, `rc_${playerId}`),
        });
      }
      await db
        .delete(appearances)
        .where(and(eq(appearances.matchId, matchId), eq(appearances.teamId, teamId)));
      if (rows.length) {
        await db.insert(appearances).values(rows).onConflictDoNothing();
      }
      return ok(`/admin/matches/${matchId}`, `Lineup saved (${rows.length} players).`);
    }
    case "addGoal": {
      const matchId = int(fd, "matchId");
      const teamId = int(fd, "teamId");
      if (!teamId) return fail(`/admin/matches/${matchId}`, "Pick which team the goal counts for.");
      await db.insert(goals).values({
        matchId,
        teamId,
        scorerId: num(fd, "scorerId"),
        assistId: num(fd, "assistId"),
        minute: num(fd, "minute"),
        isOwnGoal: bool(fd, "isOwnGoal"),
        isPenalty: bool(fd, "isPenalty"),
      });
      if (bool(fd, "syncScore")) await syncScoreInternal(matchId);
      return ok(`/admin/matches/${matchId}`, "Goal added.");
    }
    case "deleteGoal": {
      const id = int(fd, "id");
      const matchId = int(fd, "matchId");
      await db.delete(goals).where(eq(goals.id, id));
      return ok(`/admin/matches/${matchId}`, "Goal removed.");
    }
    case "syncScore": {
      const matchId = int(fd, "matchId");
      await syncScoreInternal(matchId);
      return ok(`/admin/matches/${matchId}`, "Score updated from goal events.");
    }

    // ---- Trophies ----
    case "createTrophy": {
      const kind = oneOf(fd, "kind", TROPHY_KINDS, "team");
      const name = str(fd, "name");
      const teamId = num(fd, "teamId");
      const playerId = num(fd, "playerId");
      if (!name) return fail("/admin/trophies", "Trophy name is required.");
      if (kind === "team" && !teamId) return fail("/admin/trophies", "Pick the team that won it.");
      if (kind === "individual" && !playerId) {
        return fail("/admin/trophies", "Pick the player who won it.");
      }
      await db.insert(trophies).values({
        name,
        kind,
        teamId: kind === "team" ? teamId : teamId ?? null,
        playerId: kind === "individual" ? playerId : null,
        competitionId: num(fd, "competitionId"),
        season: opt(fd, "season"),
        icon: str(fd, "icon") || "🏆",
        imageUrl: imagePath(fd, "imageUrl"),
        awardedAt: dateOnly(fd, "awardedAt"),
        notes: opt(fd, "notes"),
      });
      return ok("/admin/trophies", `${name} awarded.`);
    }
    case "deleteTrophy": {
      const id = int(fd, "id");
      await db.delete(trophies).where(eq(trophies.id, id));
      return ok("/admin/trophies", "Trophy removed.");
    }

    // ---- Site Content (Images & GFX / Team of the Season) ----
    case "createContent": {
      const v = contentValues(fd);
      if (!v.title || !v.imageUrl) {
        return fail("/admin/content", "A title and a valid image path or HTTPS URL are required.");
      }
      await db.insert(siteContent).values({ ...v, imageUrl: v.imageUrl });
      return ok("/admin/content", `${v.title} added to the overview.`);
    }
    case "updateContent": {
      const id = int(fd, "id");
      const v = contentValues(fd);
      if (!v.title || !v.imageUrl) {
        return fail("/admin/content", "A title and a valid image path or HTTPS URL are required.");
      }
      await db.update(siteContent).set({ ...v, imageUrl: v.imageUrl }).where(eq(siteContent.id, id));
      return ok("/admin/content", "Content saved.");
    }
    case "deleteContent": {
      const id = int(fd, "id");
      await db.delete(siteContent).where(eq(siteContent.id, id));
      return ok("/admin/content", "Content removed from the overview.");
    }
    case "toggleContent": {
      const id = int(fd, "id");
      const [row] = await db.select().from(siteContent).where(eq(siteContent.id, id));
      if (!row) return fail("/admin/content", "That content no longer exists.");
      await db
        .update(siteContent)
        .set({ isActive: !row.isActive })
        .where(eq(siteContent.id, id));
      return ok(
        "/admin/content",
        row.isActive ? "Hidden from the overview." : "Published to the overview.",
      );
    }

    // ---- Playersheets ----
    case "createPlayerSheet": {
      const values = sheetValues(fd);
      if (!values.slug || !values.label || !values.season) {
        return fail(
          "/admin/sheets",
          "Slug, sheet name and season are required (for example s2, S2 Playersheet, Season 2).",
        );
      }
      const [existing] = await db
        .select({ id: playerSheets.id })
        .from(playerSheets)
        .where(eq(playerSheets.slug, values.slug));
      if (existing) return fail("/admin/sheets", `The ${values.slug} sheet already exists.`);
      if (values.isCurrent) {
        await db
          .update(playerSheets)
          .set({ isCurrent: false })
          .where(eq(playerSheets.isCurrent, true));
      }
      const [sheet] = await db
        .insert(playerSheets)
        .values(values)
        .returning({ id: playerSheets.id });
      return ok(
        `/admin/sheets/${sheet.id}`,
        `${values.label} created. Paste its spreadsheet rows below.`,
      );
    }
    case "updatePlayerSheet": {
      const id = int(fd, "id");
      const path = `/admin/sheets/${id}`;
      const values = sheetValues(fd);
      if (!values.slug || !values.label || !values.season) {
        return fail(path, "Slug, sheet name and season are required.");
      }
      const [existing] = await db
        .select({ id: playerSheets.id })
        .from(playerSheets)
        .where(eq(playerSheets.slug, values.slug));
      if (existing && existing.id !== id) {
        return fail(path, `Another sheet already uses ${values.slug}.`);
      }
      if (values.isCurrent) {
        await db
          .update(playerSheets)
          .set({ isCurrent: false })
          .where(eq(playerSheets.isCurrent, true));
      }
      await db.update(playerSheets).set(values).where(eq(playerSheets.id, id));
      return ok(path, "Playersheet settings saved.");
    }
    case "deletePlayerSheet": {
      const id = int(fd, "id");
      await db.delete(playerSheets).where(eq(playerSheets.id, id));
      return ok("/admin/sheets", "Playersheet and its archived rows deleted.");
    }
    case "addPlayerSheetRow": {
      const sheetId = int(fd, "sheetId");
      const path = `/admin/sheets/${sheetId}`;
      const values = sheetRowValues(fd);
      if (!values.username) return fail(path, "A Roblox username is required.");
      await linkUsernameToPlayer(values);
      const existing = await db
        .select({ username: playerSheetRows.username })
        .from(playerSheetRows)
        .where(eq(playerSheetRows.sheetId, sheetId));
      if (existing.some((row) => row.username.toLowerCase() === values.username.toLowerCase())) {
        return fail(
          path,
          `${values.username} is already on this sheet. Edit the existing row instead.`,
        );
      }
      await db.insert(playerSheetRows).values({ ...values, sheetId });
      return ok(path, `${values.username} added to the sheet.`);
    }
    case "updatePlayerSheetRow": {
      const id = int(fd, "id");
      const sheetId = int(fd, "sheetId");
      const path = `/admin/sheets/${sheetId}`;
      const values = sheetRowValues(fd);
      if (!values.username) return fail(path, "A Roblox username is required.");
      await linkUsernameToPlayer(values);
      const existing = await db
        .select({ id: playerSheetRows.id, username: playerSheetRows.username })
        .from(playerSheetRows)
        .where(eq(playerSheetRows.sheetId, sheetId));
      if (
        existing.some(
          (row) => row.id !== id && row.username.toLowerCase() === values.username.toLowerCase(),
        )
      ) {
        return fail(path, `${values.username} appears twice on this sheet.`);
      }
      await db
        .update(playerSheetRows)
        .set(values)
        .where(and(eq(playerSheetRows.id, id), eq(playerSheetRows.sheetId, sheetId)));
      return ok(path, `${values.username} updated.`);
    }
    case "deletePlayerSheetRow": {
      const id = int(fd, "id");
      const sheetId = int(fd, "sheetId");
      await db
        .delete(playerSheetRows)
        .where(and(eq(playerSheetRows.id, id), eq(playerSheetRows.sheetId, sheetId)));
      return ok(`/admin/sheets/${sheetId}`, "Row removed from the playersheet.");
    }
    case "importPlayerSheetRows": {
      const sheetId = int(fd, "sheetId");
      const path = `/admin/sheets/${sheetId}`;
      const layout: SheetImportLayout =
        str(fd, "layout") === "usernameFirst" ? "usernameFirst" : "classFirst";
      const mode = str(fd, "mode") === "replace" ? "replace" : "merge";
      const parsed = parseSheetImport(str(fd, "raw"), layout);
      if (parsed.errors.length || !parsed.rows.length) {
        return fail(path, parsed.errors.slice(0, 4).join(" ") || "Nothing to import.");
      }

      const [allPlayers, allTeams] = await Promise.all([
        db
          .select({
            id: players.id,
            name: players.name,
            robloxUserId: players.robloxUserId,
            robloxAvatarUrl: players.robloxAvatarUrl,
          })
          .from(players),
        db.select({ id: teams.id, name: teams.name, shortName: teams.shortName }).from(teams),
      ]);
      const playerByName = new Map(allPlayers.map((p) => [p.name.toLowerCase(), p]));
      const teamByName = new Map<string, number>();
      for (const team of allTeams) {
        teamByName.set(team.name.toLowerCase(), team.id);
        teamByName.set(team.shortName.toLowerCase(), team.id);
      }

      const insertRows = parsed.rows.map((row, index) => {
        const teamId = row.teamName ? teamByName.get(row.teamName.toLowerCase()) ?? null : null;
        const matched = playerByName.get(row.username.toLowerCase());
        return {
          sheetId,
          playerId: matched?.id ?? null,
          username: row.username,
          teamId,
          teamName: teamId ? null : row.teamName,
          role: row.role,
          playerClass: row.playerClass,
          rating: row.rating,
          position: row.position,
          nation: row.nation,
          robloxUserId: matched?.robloxUserId ?? null,
          robloxAvatarUrl: matched?.robloxAvatarUrl ?? null,
          wage: row.wage,
          penalty: row.penalty,
          notes: row.notes,
          sortOrder: index + 1,
        };
      });

      await db.transaction(async (tx) => {
        if (mode === "replace") {
          await tx.delete(playerSheetRows).where(eq(playerSheetRows.sheetId, sheetId));
        } else {
          const existing = await tx
            .select({ id: playerSheetRows.id, username: playerSheetRows.username })
            .from(playerSheetRows)
            .where(eq(playerSheetRows.sheetId, sheetId));
          const incoming = new Set(parsed.rows.map((row) => row.username.toLowerCase()));
          const ids = existing
            .filter((row) => incoming.has(row.username.toLowerCase()))
            .map((row) => row.id);
          if (ids.length) await tx.delete(playerSheetRows).where(inArray(playerSheetRows.id, ids));
        }
        await tx.insert(playerSheetRows).values(insertRows);
      });

      const unmatchedPlayers = parsed.rows.filter(
        (row) => !playerByName.has(row.username.toLowerCase()),
      ).length;
      const unknownTeams = parsed.rows.filter(
        (row) => row.teamName && !teamByName.has(row.teamName.toLowerCase()),
      ).length;
      return ok(
        path,
        `${mode === "replace" ? "Replaced sheet with" : "Imported"} ${insertRows.length} rows.${unmatchedPlayers ? ` ${unmatchedPlayers} usernames are sheet-only until added to Players.` : ""}${unknownTeams ? ` ${unknownTeams} rows use archived free-text teams.` : ""}`,
      );
    }

    // ---- Data tools ----
    case "seedArchiveAction": {
      const result = await seedArchiveData();
      if (!result.ok) return fail("/admin", result.message);
      return ok("/admin", result.message);
    }
    case "clearAllAction": {
      await clearAllData();
      return ok("/admin", "All data cleared.");
    }
  }
}
