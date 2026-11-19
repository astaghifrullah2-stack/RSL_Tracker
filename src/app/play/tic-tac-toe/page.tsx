import { TicTacToeGame } from "@/components/play/TicTacToeGame";
import { getArcadeDataset } from "@/lib/arcade-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "RSL Tic-Tac-Toe · Play",
  description: "Play RSL Tiki-Taka-Toe 3x3 football grids solo, 2-player, or vs the RSL Bot.",
};

export default async function TicTacToePage() {
  const { players, scores } = await getArcadeDataset();
  const gameScores = scores.filter((s) => s.game === "tic-tac-toe");
  return <TicTacToeGame players={players} initialScores={gameScores} />;
}
