import { NextResponse } from "next/server";
import { getSessionToken, startAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let password = "";
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { password?: unknown };
      password = typeof body.password === "string" ? body.password.trim() : "";
    } else {
      const formData = await request.formData();
      const raw = formData.get("password");
      password = typeof raw === "string" ? raw.trim() : "";
    }

    const ok = await startAdminSession(password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Incorrect password. Try again." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      token: getSessionToken(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Sign-in failed. Please try again." },
      { status: 500 },
    );
  }
}
