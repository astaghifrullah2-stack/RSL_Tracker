// Roblox public API helpers. Everything runs server-side so the tracker can
// resolve usernames to user ids and pull live avatar artwork without exposing
// any client-side rate-limit issues.

const USERS_ENDPOINT = "https://users.roblox.com/v1/usernames/users";
const HEADSHOT_ENDPOINT = "https://thumbnails.roblox.com/v1/users/avatar-headshot";
const FULL_BODY_ENDPOINT = "https://thumbnails.roblox.com/v1/users/avatar";
const PROFILE_URL = "https://www.roblox.com/users";

export type RobloxIdentity = {
  username: string;
  resolved: boolean;
  userId: number | null;
  displayName: string | null;
  verified: boolean;
  headshotUrl: string | null;
  fullBodyUrl: string | null;
  profileUrl: string | null;
};

type CacheEntry = { value: RobloxIdentity; expires: number };
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const globalForRoblox = globalThis as typeof globalThis & {
  __rslRobloxCache?: Map<string, CacheEntry>;
};
const cache = (globalForRoblox.__rslRobloxCache ??= new Map<string, CacheEntry>());

export function profileUrl(userId: number) {
  return `${PROFILE_URL}/${userId}/profile`;
}

function blankIdentity(username: string): RobloxIdentity {
  return {
    username,
    resolved: false,
    userId: null,
    displayName: null,
    verified: false,
    headshotUrl: null,
    fullBodyUrl: null,
    profileUrl: null,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json", ...(init?.headers ?? {}) },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type UsersResponse = {
  data?: Array<{ id: number; name: string; displayName: string; hasVerifiedBadge?: boolean }>;
};

type ThumbnailResponse = {
  data?: Array<{ targetId: number; state: string; imageUrl: string | null }>;
};

/**
 * Resolve a batch of Roblox usernames to ids plus avatar artwork.
 * Unresolved names come back with `resolved: false` so callers can fall back
 * to initials instead of showing broken images.
 */
export async function resolveRobloxUsers(usernames: string[]): Promise<Map<string, RobloxIdentity>> {
  const unique = [...new Set(usernames.filter(Boolean))].slice(0, 100);
  const result = new Map<string, RobloxIdentity>();
  const pending: string[] = [];

  for (const name of unique) {
    const key = name.toLowerCase();
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) result.set(name, hit.value);
    else pending.push(name);
  }

  if (pending.length) {
    const users = await fetchJson<UsersResponse>(USERS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ usernames: pending, excludeBannedUsers: false }),
    });

    const matched = new Map<string, { id: number; name: string; displayName: string; hasVerifiedBadge?: boolean }>();
    for (const row of users?.data ?? []) matched.set(row.name.toLowerCase(), row);

    for (const name of pending) {
      const identity = blankIdentity(name);
      const found = matched.get(name.toLowerCase());
      if (found) {
        identity.resolved = true;
        identity.userId = found.id;
        identity.displayName = found.displayName || found.name;
        identity.verified = !!found.hasVerifiedBadge;
        identity.profileUrl = profileUrl(found.id);
      }
      cache.set(name.toLowerCase(), { value: identity, expires: Date.now() + CACHE_TTL_MS });
      result.set(name, identity);
    }

    // Avatar artwork, only for the ids we actually resolved.
    const ids = [...new Set([...result.values()].map((r) => r.userId).filter((v): v is number => v != null))];
    if (ids.length) {
      const query = `userIds=${ids.join(",")}&size=150x150&format=Png&isCircular=false`;
      const [heads, bodies] = await Promise.all([
        fetchJson<ThumbnailResponse>(`${HEADSHOT_ENDPOINT}?${query}`),
        fetchJson<ThumbnailResponse>(`${FULL_BODY_ENDPOINT}?userIds=${ids.join(",")}&size=420x420&format=Png&isCircular=false`),
      ]);
      const headById = new Map((heads?.data ?? []).map((d) => [d.targetId, d.imageUrl]));
      const bodyById = new Map((bodies?.data ?? []).map((d) => [d.targetId, d.imageUrl]));
      for (const identity of result.values()) {
        if (identity.userId == null) continue;
        identity.headshotUrl = headById.get(identity.userId) ?? null;
        identity.fullBodyUrl = bodyById.get(identity.userId) ?? null;
        cache.set(identity.username.toLowerCase(), {
          value: identity,
          expires: Date.now() + CACHE_TTL_MS,
        });
      }
    }
  }

  for (const name of unique) if (!result.has(name)) result.set(name, blankIdentity(name));
  return result;
}

export async function resolveRobloxUser(username: string): Promise<RobloxIdentity | null> {
  const map = await resolveRobloxUsers([username]);
  const found = map.get(username);
  return found?.resolved ? found : null;
}
