export const ADMIN_ACTIONS = [
  // Teams & Season Rosters
  "createTeam",
  "updateTeam",
  "deleteTeam",
  "addSeasonRosterPlayer",
  "removeSeasonRosterPlayer",
  // Players & Roblox
  "createPlayer",
  "updatePlayer",
  "deletePlayer",
  "resolvePlayerRoblox",
  "syncAllRobloxAvatars",
  // Competitions
  "createCompetition",
  "updateCompetition",
  "deleteCompetition",
  "addCompetitionEntrant",
  "removeCompetitionEntrant",
  "setCompetitionPodium",
  // Matches, Lineups & Goals
  "createMatch",
  "updateMatch",
  "deleteMatch",
  "saveLineup",
  "addGoal",
  "deleteGoal",
  "syncScore",
  // Trophies
  "createTrophy",
  "deleteTrophy",
  // Site Content / Images & GFX
  "createContent",
  "updateContent",
  "deleteContent",
  "toggleContent",
  // Playersheets
  "createPlayerSheet",
  "updatePlayerSheet",
  "deletePlayerSheet",
  "addPlayerSheetRow",
  "updatePlayerSheetRow",
  "deletePlayerSheetRow",
  "importPlayerSheetRows",
  // Data tools
  "seedArchiveAction",
  "clearAllAction",
] as const;

export type AdminActionName = (typeof ADMIN_ACTIONS)[number];
