import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { arcadeScores } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED_GAMES = new Set(["tic-tac-toe", "ultimate-team", "higher-lower"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game")?.trim() ?? "";

  const rows =
    game && ALLOWED_GAMES.has(game)
      ? await db
          .select()
          .from(arcadeScores)
          .where(eq(arcadeScores.game, game))
          .orderBy(desc(arcadeScores.score), desc(arcadeScores.createdAt))
          .limit(20)
      : await db
          .select()
          .from(arcadeScores)
          .orderBy(desc(arcadeScores.score), desc(arcadeScores.createdAt))
          .limit(40);

  return NextResponse.json({ scores: rows });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      game?: unknown;
      nickname?: unknown;
      score?: unknown;
      detail?: unknown;
    };

    const game = typeof body.game === "string" ? body.game.trim() : "";
    const nickname =
      typeof body.nickname === "string"
        ? body.nickname.trim().slice(0, 28)
        : "";
    const score = typeof body.score === "number" ? Math.trunc(body.score) : NaN;
    const detail =
      typeof body.detail === "string" ? body.detail.trim().slice(0, 120) : null;

    if (!ALLOWED_GAMES.has(game)) {
      return NextResponse.json({ ok: false, error: "Invalid game mode." }, { status: 400 });
    }
    if (!nickname || nickname.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Enter a nickname (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!Number.isFinite(score) || score <= 0 || score > 1000000) {
      return NextResponse.json({ ok: false, error: "Score must be greater than 0." }, { status: 400 });
    }

    const [created] = await db
      .insert(arcadeScores)
      .values({ game, nickname, score, detail })
      .returning();

    revalidatePath("/play", "layout");
    return NextResponse.json({ ok: true, entry: created });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save score." }, { status: 500 });
  }
}
