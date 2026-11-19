import { createHash } from "crypto";
import { cookies, headers } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  DEFAULT_ADMIN_PASSWORD,
  adminPassword,
  tokenSource,
  usingDefaultPassword,
} from "@/lib/auth-shared";

export { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_PASSWORD, adminPassword, usingDefaultPassword };

const ADMIN_AUTHED_HEADER = "x-rsl-admin-authed";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getSessionToken() {
  return createHash("sha256").update(tokenSource()).digest("hex");
}

async function isHttpsRequest() {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    if (proto === "https") return true;
    if (proto === "http") return false;
    const origin = h.get("origin") ?? h.get("referer") ?? "";
    return origin.startsWith("https://");
  } catch {
    return false;
  }
}

export async function isAdmin(formData?: FormData) {
  const expected = getSessionToken();

  try {
    const store = await cookies();
    if (store.get(ADMIN_COOKIE_NAME)?.value === expected) return true;
  } catch {
    // Ignore outside request scope
  }

  try {
    const h = await headers();
    if (h.get(ADMIN_AUTHED_HEADER) === expected) return true;
    if (h.get("x-rsl-admin-token") === expected) return true;
    const referer = h.get("referer");
    if (referer) {
      const refUrl = new URL(referer, "http://localhost");
      if (refUrl.searchParams.get("__at") === expected) return true;
    }
  } catch {
    // Ignore URL/header parse errors
  }

  if (formData) {
    const formToken = formData.get("__admin_token");
    if (typeof formToken === "string" && formToken === expected) return true;
  }

  return false;
}

export async function requireAdmin(formData?: FormData) {
  if (!(await isAdmin(formData))) {
    throw new Error("You must be logged in as an admin to do that.");
  }
}

/** Preserves ?__at= token across action navigations only if the browser blocked cookies. */
export async function preserveIframeToken(path: string, formData?: FormData) {
  try {
    const store = await cookies();
    const expected = getSessionToken();
    if (store.get(ADMIN_COOKIE_NAME)?.value === expected) return path;

    const formToken = formData?.get("__admin_token");
    const hasFormToken = typeof formToken === "string" && formToken === expected;

    let hasRefToken = false;
    const h = await headers();
    const referer = h.get("referer");
    if (referer) {
      const refToken = new URL(referer, "http://localhost").searchParams.get("__at");
      hasRefToken = refToken === expected;
    }

    if (!hasFormToken && !hasRefToken) return path;

    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}__at=${encodeURIComponent(expected)}`;
  } catch {
    return path;
  }
}

/** Must be called from a Server Action or Route Handler. */
export async function startAdminSession(password: string) {
  if (password !== adminPassword()) return false;
  const https = await isHttpsRequest();
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    ...(https ? ({ partitioned: true } as Record<string, unknown>) : {}),
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

export async function endAdminSession() {
  const https = await isHttpsRequest();
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    ...(https ? ({ partitioned: true } as Record<string, unknown>) : {}),
    path: "/",
    maxAge: 0,
  });
}
