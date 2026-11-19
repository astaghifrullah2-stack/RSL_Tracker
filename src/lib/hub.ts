import { cache } from "react";
import { getRankingsData } from "@/lib/rankings";
import { boardKey } from "@/lib/rankings-meta";
import type { LeaderBoard } from "@/lib/hub-types";

/** Compact client payload: only the first five ranked players on each board. */
export const getHubLeaderboards = cache(async (): Promise<LeaderBoard[]> => {
  const data = await getRankingsData();
  const config = [
    { id: 'index', scope: 'all', label: 'RSL index', source: 'All-time', unit: 'Index' },
    { id: 'rating', scope: 's4', label: 'Sheet OVR', source: 'Season 04', unit: 'OVR' },
    { id: 'trophies', scope: 'all', label: 'Honours', source: 'All-time', unit: 'Honours' },
    { id: 'goals', scope: 'all', label: 'Goals', source: 'All-time', unit: 'Goals' },
  ] as const;
  return config.map(c => ({
    id: c.id, label: c.label, source: c.source, unit: c.unit, href: `/rankings?board=${c.id}&season=${c.scope}`,
    rows: (data.rankings[boardKey(c.scope,c.id)] ?? []).slice(0,5).map(e => {
      const row = data.byPlayer[e.playerId];
      return { id: row.playerId, name: row.username, avatar: row.avatarUrl, rank: e.rank, value: e.value,
        club: c.scope === 's4' ? row.card.s4?.team || 'Free agent' : row.currentTeam,
        position: row.detailedPosition, className: c.scope === 's4' ? row.card.s4?.cls ?? null : row.peakClass };
    }),
  }));
});
