import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const positionEnum = pgEnum("position", ["GK", "DEF", "MID", "FWD"]);
export const competitionTypeEnum = pgEnum("competition_type", [
  "league",
  "cup",
  "tournament",
  "friendly",
]);
export const competitionStatusEnum = pgEnum("competition_status", [
  "upcoming",
  "ongoing",
  "completed",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "played",
  "postponed",
]);
export const trophyKindEnum = pgEnum("trophy_kind", ["team", "individual"]);
export const teamKindEnum = pgEnum("team_kind", ["club", "nation"]);

export const POSITIONS = positionEnum.enumValues;
export const COMPETITION_TYPES = competitionTypeEnum.enumValues;
export const COMPETITION_STATUSES = competitionStatusEnum.enumValues;
export const MATCH_STATUSES = matchStatusEnum.enumValues;
export const TROPHY_KINDS = trophyKindEnum.enumValues;

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 6 }).notNull(),
  kind: teamKindEnum("kind").notNull().default("club"),
  badgeUrl: text("badge_url"),
  primaryColor: text("primary_color").notNull().default("#ff7518"),
  secondaryColor: text("secondary_color").notNull().default("#10245c"),
  manager: text("manager"),
  founded: text("founded"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  // Roblox username
  name: text("name").notNull(),
  displayName: text("display_name"),
  /** Resolved Roblox user id (Roblox ids exceed 32-bit, so stored as text). */
  robloxUserId: text("roblox_user_id"),
  /** Cached avatar headshot URL from the Roblox thumbnails API. */
  robloxAvatarUrl: text("roblox_avatar_url"),
  robloxVerified: boolean("roblox_verified").notNull().default(false),
  teamId: integer("team_id").references(() => teams.id, {
    onDelete: "set null",
  }),
  position: positionEnum("position").notNull().default("MID"),
  number: integer("number"),
  nationality: text("nationality"),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Competitions (league seasons, cups, friendlies)
// ---------------------------------------------------------------------------
export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: competitionTypeEnum("type").notNull().default("league"),
  badgeUrl: text("badge_url"),
  season: text("season"),
  status: competitionStatusEnum("status").notNull().default("upcoming"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Competition entrants & verified archive results. These are stored separately
// from match data so historic champions can be recorded without inventing scores.
// ---------------------------------------------------------------------------
export const competitionEntrants = pgTable(
  "competition_entrants",
  {
    id: serial("id").primaryKey(),
    competitionId: integer("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("competition_entrant_idx").on(t.competitionId, t.teamId)],
);

export const competitionPlacements = pgTable(
  "competition_placements",
  {
    id: serial("id").primaryKey(),
    competitionId: integer("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    placement: integer("placement").notNull(), // 1 = champion, 2 = runner-up
  },
  (t) => [uniqueIndex("competition_placement_idx").on(t.competitionId, t.placement)],
);

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id")
    .notNull()
    .references(() => competitions.id, { onDelete: "cascade" }),
  homeTeamId: integer("home_team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  awayTeamId: integer("away_team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  playedAt: timestamp("played_at", { withTimezone: true }),
  round: text("round"),
  venue: text("venue"),
  notes: text("notes"),
  motmPlayerId: integer("motm_player_id").references(() => players.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Goals (one row per goal, with optional assist)
// ---------------------------------------------------------------------------
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  // Team credited with the goal
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  scorerId: integer("scorer_id").references(() => players.id, {
    onDelete: "set null",
  }),
  assistId: integer("assist_id").references(() => players.id, {
    onDelete: "set null",
  }),
  minute: integer("minute"),
  isOwnGoal: boolean("is_own_goal").notNull().default(false),
  isPenalty: boolean("is_penalty").notNull().default(false),
});

// ---------------------------------------------------------------------------
// Appearances (match sheets / lineups)
// ---------------------------------------------------------------------------
export const appearances = pgTable(
  "appearances",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    position: positionEnum("position").notNull().default("MID"),
    yellowCards: integer("yellow_cards").notNull().default(0),
    redCard: boolean("red_card").notNull().default(false),
  },
  (t) => [uniqueIndex("appearances_match_player_idx").on(t.matchId, t.playerId)],
);

// ---------------------------------------------------------------------------
// Trophies & individual awards
// ---------------------------------------------------------------------------
export const trophies = pgTable("trophies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: trophyKindEnum("kind").notNull().default("team"),
  teamId: integer("team_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  playerId: integer("player_id").references(() => players.id, {
    onDelete: "cascade",
  }),
  competitionId: integer("competition_id").references(() => competitions.id, {
    onDelete: "set null",
  }),
  season: text("season"),
  icon: text("icon").notNull().default("🏆"),
  /** Custom artwork for the trophy, shown on profiles and award lists. */
  imageUrl: text("image_url"),
  awardedAt: date("awarded_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Admin-managed site content (GFX, Team of the Season, hero art, notes)
// ---------------------------------------------------------------------------
export const siteContentEnum = pgEnum("site_content_kind", [
  "gfx",
  "totw",
  "totw-team",
  "hero",
  "custom",
]);

export const SITE_CONTENT_KINDS = siteContentEnum.enumValues;

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  kind: siteContentEnum("kind").notNull().default("gfx"),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  caption: text("caption"),
  season: text("season"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Playersheets — preserved season-by-season spreadsheet archives
// ---------------------------------------------------------------------------
export const playerSheets = pgTable("player_sheets", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(), // s2, s3, s4
  label: text("label").notNull(), // S2 Playersheet
  season: text("season").notNull(),
  description: text("description"),
  sourceUrl: text("source_url"),
  isCurrent: boolean("is_current").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const playerSheetRows = pgTable(
  "player_sheet_rows",
  {
    id: serial("id").primaryKey(),
    sheetId: integer("sheet_id")
      .notNull()
      .references(() => playerSheets.id, { onDelete: "cascade" }),
    playerId: integer("player_id").references(() => players.id, {
      onDelete: "set null",
    }),
    username: text("username").notNull(),
    teamId: integer("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    /** Free-text team for archived clubs that aren't in the current database. */
    teamName: text("team_name"),
    role: text("role").notNull().default("PLAYER"),
    playerClass: text("player_class").notNull().default("UNRATED"),
    /** Overall rating shown next to the class, e.g. S+ 90. */
    rating: integer("rating"),
    /** Sheet position (ST, CAM, CM, CDM, CB, GK...). */
    position: text("position"),
    /** Nation / high-rank column from the original sheet. */
    nation: text("nation"),
    robloxUserId: text("roblox_user_id"),
    robloxAvatarUrl: text("roblox_avatar_url"),
    wage: integer("wage"),
    penalty: integer("penalty"),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("player_sheet_username_idx").on(t.sheetId, t.username)],
);

// ---------------------------------------------------------------------------
// Season rosters — preserved championship & season squads for teams
// ---------------------------------------------------------------------------
export const teamSeasonRosters = pgTable(
  "team_season_rosters",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    season: text("season").notNull(), // e.g. "Season 1"
    label: text("label").notNull().default("Season 1 Winners"),
    discordHandle: text("discord_handle"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("team_season_roster_idx").on(t.teamId, t.season, t.playerId)],
);

// ---------------------------------------------------------------------------
// Play / Mini-Games Arcade — leaderboards & community dream squads
// ---------------------------------------------------------------------------
export const arcadeScores = pgTable("arcade_scores", {
  id: serial("id").primaryKey(),
  /** Game slug: tic-tac-toe | ultimate-team | higher-lower */
  game: varchar("game", { length: 32 }).notNull(),
  nickname: varchar("nickname", { length: 32 }).notNull(),
  score: integer("score").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const communitySquads = pgTable("community_squads", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 60 }).notNull(),
  author: varchar("author", { length: 32 }).notNull(),
  formation: varchar("formation", { length: 24 }).notNull(),
  mode: varchar("mode", { length: 16 }).notNull().default("6v6"),
  ovr: integer("ovr").notNull().default(0),
  chemistry: integer("chemistry").notNull().default(0),
  totalWage: integer("total_wage").notNull().default(0),
  /** JSON-serialized array of { slotId, playerId }. */
  slotsJson: text("slots_json").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
export type CompetitionEntrant = typeof competitionEntrants.$inferSelect;
export type CompetitionPlacement = typeof competitionPlacements.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Appearance = typeof appearances.$inferSelect;
export type NewAppearance = typeof appearances.$inferInsert;
export type Trophy = typeof trophies.$inferSelect;
export type NewTrophy = typeof trophies.$inferInsert;
export type SiteContent = typeof siteContent.$inferSelect;
export type NewSiteContent = typeof siteContent.$inferInsert;
export type SiteContentKind = (typeof SITE_CONTENT_KINDS)[number];
export type PlayerSheet = typeof playerSheets.$inferSelect;
export type NewPlayerSheet = typeof playerSheets.$inferInsert;
export type PlayerSheetRow = typeof playerSheetRows.$inferSelect;
export type NewPlayerSheetRow = typeof playerSheetRows.$inferInsert;
export type TeamSeasonRoster = typeof teamSeasonRosters.$inferSelect;
export type NewTeamSeasonRoster = typeof teamSeasonRosters.$inferInsert;
export type ArcadeScore = typeof arcadeScores.$inferSelect;
export type NewArcadeScore = typeof arcadeScores.$inferInsert;
export type CommunitySquad = typeof communitySquads.$inferSelect;
export type NewCommunitySquad = typeof communitySquads.$inferInsert;

export type Position = (typeof POSITIONS)[number];
export type CompetitionType = (typeof COMPETITION_TYPES)[number];
export type CompetitionStatus = (typeof COMPETITION_STATUSES)[number];
export type MatchStatus = (typeof MATCH_STATUSES)[number];
export type TrophyKind = (typeof TROPHY_KINDS)[number];
