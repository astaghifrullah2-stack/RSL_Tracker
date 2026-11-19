import { NextResponse } from "next/server";
import { ADMIN_ACTIONS, type AdminActionName } from "@/lib/admin-action-names";
import { executeAdminMutation } from "@/lib/admin-mutations";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    if (!(await isAdmin(formData))) {
      return NextResponse.json(
        { ok: false, error: "Your admin session expired. Please sign in again." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const rawAction =
      (typeof formData.get("__action") === "string" ? String(formData.get("__action")) : "") ||
      url.searchParams.get("action") ||
      "";

    if (!(ADMIN_ACTIONS as readonly string[]).includes(rawAction)) {
      return NextResponse.json(
        { ok: false, error: `Unknown admin action "${rawAction}".` },
        { status: 400 },
      );
    }

    const result = await executeAdminMutation(rawAction as AdminActionName, formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred while saving.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
