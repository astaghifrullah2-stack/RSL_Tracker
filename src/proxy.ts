import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, sessionTokenWebCrypto } from "@/lib/auth-shared";

export const ADMIN_AUTHED_HEADER = "x-rsl-admin-authed";

/**
 * Non-redirecting auth pass-through for /admin routes.
 * Avoids HTTP 307 redirects (which break inside reverse-proxied preview iframes)
 * and lets AdminLayout render the login screen in-place with 200 OK.
 */
export async function proxy(request: NextRequest) {
  const expected = await sessionTokenWebCrypto();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const queryToken = request.nextUrl.searchParams.get("__at");
  const headerToken = request.headers.get("x-rsl-admin-token");

  const candidate = cookieToken || headerToken || queryToken || "";
  const authed = !!candidate && candidate === expected;

  // Always clone request headers and explicitly overwrite ADMIN_AUTHED_HEADER
  // so external requests can never spoof it.
  const requestHeaders = new Headers(request.headers);
  if (authed) {
    requestHeaders.set(ADMIN_AUTHED_HEADER, expected);
    // Align x-forwarded-host with Origin on verified admin requests so reverse
    // proxies rewriting Host never trip Server Action origin checks.
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        requestHeaders.set("x-forwarded-host", new URL(origin).host);
      } catch {
        // Ignore malformed Origin header
      }
    }
  } else {
    requestHeaders.delete(ADMIN_AUTHED_HEADER);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
