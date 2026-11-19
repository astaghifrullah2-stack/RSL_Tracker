"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { LeagueImage } from "./LeagueImage";
import { useWatchlist, WatchButton } from "./Watchlist";
import type { FinderEntry } from "@/lib/hub-types";

const typeIcon: Record<FinderEntry["type"], IconName> = { Player: "players", Team: "club", Competition: "trophy", Page: "grid" };
const tabs = ["All", "Player", "Team", "Competition", "Page"] as const;
const labels = { All: "All results", Player: "Players", Team: "Teams", Competition: "Competitions", Page: "Pages" };
const norm = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function LeagueFinder() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"search" | "watchlist">("search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof tabs)[number]>("All");
  const [entries, setEntries] = useState<FinderEntry[] | null>(null);
  const [failure, setFailure] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState(0);
  const savedIds = useWatchlist();
  const [picks, setPicks] = useState<number[]>([]);
  const comparison = picks.filter(id => savedIds.includes(id) && entries?.some(e => e.playerId === id));
  const openFinder = useCallback((next: "search" | "watchlist") => {
    if (!dialog.current) return;
    trigger.current = document.activeElement as HTMLElement | null;
    setPicks([]); setMode(next); setQuery(""); setType("All"); setActive(0); setOpen(true);
    if (!dialog.current.open) dialog.current.showModal();
    requestAnimationFrame(() => search.current?.focus());
  }, []);
  const close = useCallback(() => { dialog.current?.close(); }, []);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close(); else openFinder("search");
      }
    };
    document.addEventListener("keydown", keys); return () => document.removeEventListener("keydown", keys);
  }, [openFinder, close]);
  useEffect(() => {
    if (!open || entries) return;
    const controller = new AbortController();
    fetch("/api/finder", { signal: controller.signal }).then(async res => {
      if (!res.ok) throw new Error();
      const body = await res.json() as { entries: FinderEntry[] };
      setEntries(body.entries); setFailure(false);
    }).catch(() => { if (!controller.signal.aborted) setFailure(true); });
    return () => controller.abort();
  }, [entries, open, attempt]);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = before; };
  }, [open]);
  const hits = useMemo(() => {
    const q = norm(query.trim());
    let pool = (entries || []).filter(e => mode === "watchlist" ? !!e.playerId && savedIds.includes(e.playerId) : type === "All" || e.type === type);
    if (q) {
      pool = pool.filter(e => norm(`${e.title} ${e.keywords} ${e.detail}`).includes(q)).sort((a,b) => {
        const points = (e: FinderEntry) => norm(e.title) === q ? 3 : norm(e.title).startsWith(q) ? 2 : norm(e.title).includes(q) ? 1 : 0;
        return points(b) - points(a) || a.title.localeCompare(b.title);
      });
    }
    return pool;
  }, [entries, mode, query, savedIds, type]);
  const visible = hits.slice(0, 40);
  function go(entry: FinderEntry) { close(); router.push(entry.href); }
  return <>
    <button className="hub-search-trigger" onClick={() => openFinder("search")} aria-label="Search the tracker (Control or Command K)" title="Search the tracker"><Icon name="search" size={17}/><span>Search</span><kbd>⌘ K</kbd></button>
    <button className="hub-icon-button header-watch" onClick={() => openFinder("watchlist")} aria-label={`Open watchlist, ${savedIds.length} saved players`} title="My watchlist"><Icon name="bookmark" size={18}/>{savedIds.length > 0 && <i/>}</button>
    <dialog ref={dialog} aria-labelledby="finder-title" className="hub-dialog" onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={e => { if (e.target === dialog.current) close(); }}>
      <div className="finder-inner">
        <div className="finder-title"><span className="section-kicker">RSL / LEAGUE DIRECTORY</span><button aria-label="Close search" className="hub-icon-button" onClick={close}><Icon name="cross"/></button></div>
        <h2 id="finder-title">{mode === "watchlist" ? "My watchlist" : "Search the tracker"}</h2>
        <p>{mode === "watchlist" ? "Saved on this device. Select two players to compare their records." : "Jump straight to a player, team, competition or page."}</p>
        <label className="finder-field"><Icon name="search"/><input ref={search} type="search" value={query} aria-label={mode === "watchlist" ? "Filter saved players" : "Search the league"} placeholder={mode === "watchlist" ? "Filter your watchlist…" : "Search names, clubs, Roblox IDs…"} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={e => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const i = Math.max(0, Math.min(visible.length - 1, active + (e.key === "ArrowDown" ? 1 : -1))); setActive(i); document.getElementById(`finder-row-${i}`)?.scrollIntoView({block: "nearest"}); }
          if (e.key === "Enter" && visible[active]) { e.preventDefault(); go(visible[active]); }
        }}/></label>
        {mode === "search" ? <div className="finder-tabs">{tabs.map(t => <button key={t} type="button" aria-pressed={type === t} className={type === t ? "is-active" : ""} onClick={() => { setType(t); setActive(0); search.current?.focus(); }}>{labels[t]}</button>)}</div> : <div className="finder-section-label"><Icon name="bookmark" size={14}/>{savedIds.length} saved {savedIds.length === 1 ? "player" : "players"}</div>}
        <div className="finder-results" aria-live="polite">
          {!entries ? <div className="finder-empty">{failure ? <><p>Couldn’t load the league directory.</p><button className="hub-ghost" onClick={() => { setFailure(false); setAttempt(n => n + 1); }}>Retry</button></> : "Loading the league directory…"}</div> : visible.length ? visible.map((entry,i) => <div id={`finder-row-${i}`} key={entry.key} className={`finder-row ${i === active ? "is-active" : ""}`}>
            {mode === "watchlist" && entry.playerId && <input className="compare-check" type="checkbox" aria-label={`Compare ${entry.title}`} checked={comparison.includes(entry.playerId)} disabled={!comparison.includes(entry.playerId) && comparison.length >= 2} onChange={() => { const id = entry.playerId!; setPicks(comparison.includes(id) ? comparison.filter(x => x !== id) : [...comparison,id].slice(0,2)); }}/>} 
            <button onClick={() => go(entry)} className="finder-result-link" onMouseEnter={() => setActive(i)}>
              <span className={`finder-item-icon icon-${entry.type.toLowerCase()}`}>{entry.image ? <LeagueImage src={entry.image} username={entry.type === "Player" ? entry.title : undefined}/> : <Icon name={typeIcon[entry.type]}/>}</span>
              <span><b>{entry.title}</b><small>{entry.detail}</small></span><em>{entry.type}</em>
            </button>
            {entry.playerId ? <WatchButton playerId={entry.playerId} username={entry.title} compact/> : <Icon name="right" size={13}/>}
          </div>) : <div className="finder-empty"><Icon name={mode === "watchlist" ? "bookmark" : "search"} size={26}/><b>{mode === "watchlist" && !savedIds.length ? "Start your scouting list" : "No matches found"}</b><p>{mode === "watchlist" && !savedIds.length ? "Save a player using the bookmark on a profile or ranking row." : "Try a different name, club or username."}</p></div>}
        </div>
        {mode === "watchlist" && savedIds.length > 0 && <div className="watch-compare"><span><Icon name="compare" size={15}/>{comparison.length} / 2 selected</span><button type="button" className="hub-primary" disabled={comparison.length !== 2} onClick={() => { if (comparison.length === 2) { close(); router.push(`/play/compare?a=${comparison[0]}&b=${comparison[1]}`); } }}>Compare players <Icon name="arrow" size={14}/></button></div>}
        <div className="finder-footer">{mode === "watchlist" ? <button className="hub-text-link" onClick={() => { setMode("search"); setType("Player"); setQuery("");setActive(0);search.current?.focus(); }}>Find players <Icon name="arrow" size={14}/></button> : <span>{entries ? `${hits.length} ${hits.length === 1 ? "result" : "results"}${hits.length > 40 ? " · showing first 40" : ""}` : "RSL Tracker"}</span>}<span><kbd>esc</kbd> to close</span></div>
      </div>
    </dialog>
  </>;
}
