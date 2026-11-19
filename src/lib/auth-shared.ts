// Runtime-agnostic auth constants shared by the Node auth helpers and proxy.
export const ADMIN_COOKIE_NAME = "rsl_admin_session";
export const DEFAULT_ADMIN_PASSWORD = "ItalianMafiaMaldini";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

export function usingDefaultPassword() {
  return !process.env.ADMIN_PASSWORD?.trim();
}

export function tokenSource() {
  return `rsl-league-tracker:${adminPassword()}`;
}

/** SHA-256 hex using Web Crypto (works in Node and Edge runtimes). */
export async function sessionTokenWebCrypto() {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tokenSource()));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
