import { SquadBuilderGame } from "@/components/play/SquadBuilderGame";
import { getArcadeDataset } from "@/lib/arcade-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Squad Builder · Play",
  description: "Build TCS 6v6, 7v7 and 11v11 RSL dream squads with chemistry links and wage caps.",
};

export default async function SquadBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ load?: string }>;
}) {
  const { load } = await searchParams;
  const { players, squads } = await getArcadeDataset();
  return (
    <SquadBuilderGame
      players={players}
      initialSquads={squads}
      initialLoadId={load ? Number(load) : undefined}
    />
  );
}
