import type { ReactNode } from "react";

const strokes = {
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z"/>,
  shield: <><path d="m12 3 8 3v5c0 5.2-3.4 8.7-8 11-4.6-2.3-8-5.8-8-11V6z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
  club: <><path d="m12 2 8 3v6.5c0 4.8-4 8.3-8 10.5-4-2.2-8-5.7-8-10.5V5Z"/><path d="M12 6v12M7.5 8v5M16.5 8v5"/></>,
  trophy: <><path d="M7 3h10v6.5a5 5 0 0 1-10 0zM12 15v4.5M8 21h8M7 5H3v2a5 5 0 0 0 4.5 5M17 5h4v2a5 5 0 0 1-4.5 5"/></>,
  players: <><circle cx="9" cy="8" r="3.3"/><path d="M2.5 20v-2a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v2M16 5a3.3 3.3 0 0 1 0 6.2M18 13.5a4.5 4.5 0 0 1 3.5 4.5v2"/></>,
  layers: <><path d="m12 3 10 5-10 5L2 8zM3 12l9 4.5 9-4.5M3 16l9 4.5 9-4.5"/></>,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M9 12h6"/></>,
  arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
  diagonal: <><path d="M5 19 18.5 5.5M6 5h13v13"/></>,
  down: <path d="m6 9 6 6 6-6"/>,
  left: <path d="m15 5-7 7 7 7"/>,
  right: <path d="m9 5 7 7-7 7"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2"/></>,
  pulse: <path d="M2 12h5l3-7 4 14 3-7h5"/>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  chart: <><path d="M4 4v16h17M8 16v-6m5 6V6m5 10v-4"/></>,
  history: <><path d="M3.5 10a8.5 8.5 0 1 1 .5 6M3 5v5h5M12 7v5l3 2"/></>,
  transfer: <><path d="M3 7h16l-4-4m6 14H5l4 4"/></>,
  joystick: <><path d="M6 8h12c2.7 0 3.6 4.5 3.8 8 .1 2.8-2.4 3.6-4.3 1.7L15 15h-6l-2.5 2.7c-1.9 1.9-4.4 1.1-4.3-1.7C2.4 12.5 3.3 8 6 8Z"/><path d="M6 11.5v3m-1.5-1.5h3m8.5-1h.01m2 2h.01"/></>,
  cross: <path d="m6 6 12 12M18 6 6 18"/>,
  menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
  star: <path d="m12 2 3 6.5 7 .9-5.1 5 1.3 7-6.2-3.4-6.2 3.4 1.3-7-5.1-5 7-.9z"/>,
  flag: <><path d="M4 22V4m0 1c5-4 10 3 16-1v11c-6 4-11-3-16 1"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l3.5 2"/></>,
  sheet: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16m-16 5h16m-16 4h16M10 8v13"/></>,
  compare: <><path d="M5 4v16M12 7v13M19 2v18M3 20h18"/></>,
  check: <path d="m4 12 5 5L20 6"/>,
  enter: <><path d="M20 5v9H5m4-4-4 4 4 4"/></>,
  book: <><path d="M12 6c-3.5-2.5-7-2.5-10-1v13c3-1.5 6.5-1.5 10 1 3.5-2.5 7-2.5 10-1V5c-3-1.5-6.5-1.5-10 1Zm0 0v13"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8z"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
  pitch: <><rect x="2" y="4" width="20" height="16" rx="1"/><path d="M12 4v16M2 9h3v6H2m20-6h-3v6h3"/><circle cx="12" cy="12" r="3"/></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof strokes;

export function Icon({ name, size = 18, className = "", fill = false }: { name: IconName; size?: number; className?: string; fill?: boolean }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className}>{strokes[name]}</svg>;
}
