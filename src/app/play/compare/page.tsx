import Link from "next/link";
import { ComparePlayersLab } from "@/components/play/ComparePlayersLab";
import { getArcadeDataset } from "@/lib/arcade-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compare players · Play", description: "Head-to-head RSL player comparison with attribute radar, season ratings and awards." };
export default async function ComparePlayersPage({searchParams}:{searchParams:Promise<{a?:string;b?:string}>}) {
  const [{players}, {a,b}] = await Promise.all([getArcadeDataset(), searchParams]);
  if (players.length < 2) return <section className="panel p-6"><h1 className="page-title">Compare players</h1><p className="muted mt-2">Two registered players are needed for a head-to-head comparison.</p><Link href="/players" className="btn mt-4">Player database</Link></section>;
  return <ComparePlayersLab key={`${a || 'default'}:${b || 'default'}`} players={players} initialA={Number(a) || undefined} initialB={Number(b) || undefined}/>;
}
