"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "./Icon";

const KEY = "rsl.watchlist.v1";
const EMPTY: readonly number[] = [];
let lastRaw: string | null = null;
let memory: readonly number[] = EMPTY;
function subscribe(listener: () => void) {
  window.addEventListener("rsl:watchlist", listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener("rsl:watchlist", listener); window.removeEventListener("storage", listener); };
}
function getSnapshot(): readonly number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== lastRaw) {
      const parsed: unknown = JSON.parse(raw || "[]");
      memory = Array.isArray(parsed) ? [...new Set(parsed.filter((x): x is number => Number.isSafeInteger(x) && x > 0))] : EMPTY;
      lastRaw = raw;
    }
  } catch { /* Private browsing still supports a session-only list. */ }
  return memory;
}
export function useWatchlist() { return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY); }
function toggle(id: number) {
  const current = getSnapshot();
  memory = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
  try { const raw = JSON.stringify(memory); localStorage.setItem(KEY, raw); lastRaw = raw; } catch { /* Keep session state. */ }
  window.dispatchEvent(new Event("rsl:watchlist"));
}

export function WatchButton({ playerId, username, compact = false }: { playerId: number; username: string; compact?: boolean }) {
  const saved = useWatchlist().includes(playerId);
  const [notice, setNotice] = useState("");
  const label = `${saved ? "Remove" : "Save"} ${username} ${saved ? "from" : "to"} watchlist`;
  return <button type="button" className={`watch-button ${compact ? "watch-small" : "watch-full"} ${saved ? "is-saved" : ""}`} aria-pressed={saved} aria-label={label} title={label} onClick={() => { toggle(playerId); setNotice(saved ? `${username} removed from watchlist` : `${username} saved to watchlist`); }}>
    <Icon name="bookmark" size={compact ? 15 : 16} fill={saved} />
    {!compact && <span>{saved ? "Watching" : "Watch player"}</span>}
    <span role="status" className="sr-only">{notice}</span>
  </button>;
}
