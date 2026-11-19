import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { communitySquads } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(communitySquads)
    .orderBy(desc(communitySquads.likes), desc(communitySquads.createdAt))
    .limit(24);
  return NextResponse.json({ squads: rows });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: unknown;
      squadId?: unknown;
      title?: unknown;
      author?: unknown;
      formation?: unknown;
      mode?: unknown;
      ovr?: unknown;
      chemistry?: unknown;
      totalWage?: unknown;
      slots?: unknown;
    };

    if (body.action === "like") {
      const squadId = Number(body.squadId);
      if (!Number.isFinite(squadId) || squadId <= 0) {
        return NextResponse.json({ ok: false, error: "Invalid squad." }, { status: 400 });
      }
      const [updated] = await db
        .update(communitySquads)
        .set({ likes: sql`${communitySquads.likes} + 1` })
        .where(eq(communitySquads.id, squadId))
        .returning();
      revalidatePath("/play", "layout");
      return NextResponse.json({ ok: true, squad: updated });
    }

    const title = typeof body.title === "string" ? body.title.trim().slice(0, 60) : "";
    const author = typeof body.author === "string" ? body.author.trim().slice(0, 32) : "";
    const formation = typeof body.formation === "string" ? body.formation.trim().slice(0, 24) : "";
    const mode = typeof body.mode === "string" ? body.mode.trim().slice(0, 16) : "6v6";
    const ovr = Math.max(0, Math.min(99, Math.trunc(Number(body.ovr) || 0)));
    const chemistry = Math.max(0, Math.min(33, Math.trunc(Number(body.chemistry) || 0)));
    const totalWage = Math.max(0, Math.trunc(Number(body.totalWage) || 0));

    if (!title || !author || !formation || !Array.isArray(body.slots) || body.slots.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Fill every position and enter a squad name and builder name." },
        { status: 400 },
      );
    }

    const cleanSlots = body.slots
      .slice(0, 11)
      .map((s: { slotId?: unknown; playerId?: unknown }) => ({
        slotId: String(s?.slotId ?? ""),
        playerId: Number(s?.playerId ?? 0),
      }))
      .filter((s) => s.slotId && Number.isFinite(s.playerId) && s.playerId > 0);

    if (cleanSlots.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Complete every position on the pitch before publishing." },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(communitySquads)
      .values({
        title,
        author,
        formation,
        mode,
        ovr,
        chemistry,
        totalWage,
        slotsJson: JSON.stringify(cleanSlots),
      })
      .returning();

    revalidatePath("/play", "layout");
    return NextResponse.json({ ok: true, squad: created });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save squad." }, { status: 500 });
  }
}
