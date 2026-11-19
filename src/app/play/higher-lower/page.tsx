import { HigherLowerGame } from "@/components/play/HigherLowerGame";
import { getArcadeDataset } from "@/lib/arcade-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Higher or Lower · Play",
  description: "Guess higher or lower on RSL player peak wages and overall ratings.",
};

export default async function HigherLowerPage() {
  const { players, scores } = await getArcadeDataset();
  const hlScores = scores.filter((s) => s.game === "higher-lower");
  return <HigherLowerGame players={players} initialScores={hlScores} />;
}
