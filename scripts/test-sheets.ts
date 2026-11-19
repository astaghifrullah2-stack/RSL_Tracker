import "dotenv/config";
import { getPlayerSheets, getSheetRowsView, groupSheetRows } from "../src/lib/player-sheets";
import { pool } from "../src/db";

async function main() {
  const data = await getPlayerSheets();
  console.log("sheets:", data.sheets.map((s) => s.slug));
  const s4 = data.sheets.find((s) => s.slug === "s4");
  if (!s4) throw new Error("s4 not found");
  const rows = await getSheetRowsView(s4.id);
  console.log("s4 rows count:", rows.length);
  const groups = groupSheetRows(rows);
  console.log("groups:", groups.map((g) => [g.family, g.rows.length]));
  console.log("Sample row 0:", rows[0]);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
