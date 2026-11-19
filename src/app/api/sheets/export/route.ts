import { getPlayerSheets, getSheetRowsView, sheetRowsToCsv } from "@/lib/player-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("sheet")?.toLowerCase() ?? "";
  const data = await getPlayerSheets();
  const sheet = data.sheets.find((item) => item.slug === slug) ?? data.current;
  if (!sheet) return Response.json({ error: "Playersheet not found." }, { status: 404 });

  const rows = await getSheetRowsView(sheet.id);
  const csv = sheetRowsToCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sheet.slug}-playersheet.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
