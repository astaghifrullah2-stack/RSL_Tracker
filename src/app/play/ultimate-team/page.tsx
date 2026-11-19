import { UltimateTeamGame } from "@/components/play/UltimateTeamGame";
import { getArcadeDataset } from "@/lib/arcade-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ultimate Team · Play",
  description: "Open RSL player packs, build your Club Binder, and play the EUROS FUT Draft.",
};

export default async function UltimateTeamPage() {
  const { players, scores } = await getArcadeDataset();
  const utScores = scores.filter((s) => s.game === "ultimate-team");
  return <UltimateTeamGame players={players} initialScores={utScores} />;
}
