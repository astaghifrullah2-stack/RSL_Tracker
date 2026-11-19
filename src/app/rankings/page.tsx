import { RankingsDashboard } from "@/components/rankings/RankingsDashboard";
import { getRankingsData } from "@/lib/rankings";
import { BOARD_IDS, RANKING_SCOPES, type BoardId, type RankingScope } from "@/lib/rankings-meta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rankings", description: "Explore official RSL match statistics, sheet ratings, honours and the all-time RSL Index." };
export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ board?: string; season?: string }> }) {
  const [data, sp] = await Promise.all([getRankingsData(), searchParams]);
  const board = BOARD_IDS.find(id => id === sp.board) ?? "index";
  const season = RANKING_SCOPES.find(id => id === sp.season) ?? "all";
  return <RankingsDashboard data={data} key={`${board}:${season}`} initialBoard={board as BoardId} initialScope={season as RankingScope}/>;
}
