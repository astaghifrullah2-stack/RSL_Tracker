"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { playMenuLinks } from "@/lib/site";
import { Icon, type IconName } from "@/components/hub/Icon";
import { LeagueFinder } from "@/components/hub/LeagueFinder";

type NavItem = { href: string; label: string; icon: IconName };
const primary: NavItem[] = [
  {href: "/", label: "Overview", icon: "grid"}, {href: "/competitions", label: "Competitions", icon: "trophy"},
  {href: "/players", label: "Players", icon: "players"}, {href: "/teams", label: "Teams", icon: "club"},
  {href: "/rankings", label: "Rankings", icon: "chart"},
];
const tools: NavItem[] = [
  {href: "/sheets", label: "Playersheets", icon: "sheet"}, {href: "/matches", label: "Match centre", icon: "pitch"},
  {href: "/transfers", label: "Transfers", icon: "transfer"}, {href: "/archive", label: "Season archive", icon: "archive"},
  {href: "/stats", label: "Statistics", icon: "chart"}, {href: "/records", label: "Records", icon: "book"},
];
const games: NavItem[] = playMenuLinks.map(x => ({href: x.href, label: x.label, icon: "joystick"}));

export function Nav() {
  const pathname = usePathname();
  const [menu, setMenu] = useState<"play" | "more" | "mobile" | null>(null);
  const header = useRef<HTMLElement>(null);
  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  useEffect(() => {
    function outside(e: PointerEvent) { if (!header.current?.contains(e.target as Node)) setMenu(null); }
    function key(e: KeyboardEvent) { if (e.key === "Escape") setMenu(null); }
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
    return () => {document.removeEventListener("pointerdown", outside);document.removeEventListener("keydown", key);};
  }, []);
  const close = () => setMenu(null);
  return <header ref={header} className="league-header">
    <div className="league-header-inner">
      <Link href="/" onClick={close} className="hub-brand" aria-label="RSL Tracker overview">
        <Image src="/images/rsl-euros-crest.png" alt="" width={46} height={46} priority className="hub-crest"/>
          <span><strong>RSL <i>TRACKER</i></strong><small>ROBLOXIAN SPANISH LEAGUE</small></span>
      </Link>
      <nav className="hub-main-nav" aria-label="Main navigation">
        {primary.map(x => <Link key={x.href} className={active(x.href) ? "selected" : ""} href={x.href} onClick={close} aria-current={active(x.href) ? "page" : undefined}>{x.label}</Link>)}
        {([['play','Play',games],['more','More',tools]] as const).map(([id,label,list]) => <div className="nav-pop-wrap" key={id} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(m => m === id ? null : m); }}>
          <button className={(id === 'play' ? active('/play') : tools.some(t => active(t.href))) ? 'selected' : ''} aria-expanded={menu === id} aria-controls={`nav-${id}`} onClick={() => setMenu(menu === id ? null : id)}>{label}<Icon name="down" size={12}/></button>
          {menu === id && <div id={`nav-${id}`} className="nav-pop"><small>{id === "play" ? "RSL ARCADE" : "EXPLORE THE LEAGUE"}</small>{list.map(x => <Link href={x.href} key={x.href} onClick={close}><Icon name={x.icon} size={16}/>{x.label}<Icon name="right" size={12}/></Link>)}</div>}
        </div>)}
      </nav>
      <div className="hub-header-tools"><LeagueFinder/><span className="header-separator"/>
        <Link href="/admin" aria-label="Open Admin" className={`hub-admin ${active('/admin') ? 'active' : ''}`} onClick={close}><Icon name="lock" size={14}/><span>Admin</span></Link>
        <button className="hub-mobile-toggle hub-icon-button" onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} aria-expanded={menu === 'mobile'} aria-controls="mobile-nav" aria-label={menu === 'mobile' ? 'Close navigation' : 'Open navigation'}><Icon name={menu === 'mobile' ? 'cross' : 'menu'} size={21}/></button>
      </div>
    </div>
    {menu === 'mobile' && <nav id="mobile-nav" className="hub-mobile-nav" aria-label="Mobile navigation">{[...primary,...tools,{href:'/play', label:'Play · Games hub', icon:'joystick' as const}].map(x => <Link href={x.href} onClick={close} className={active(x.href) ? 'selected' : ''} key={x.href}><Icon name={x.icon} size={17}/>{x.label}</Link>)}</nav>}
  </header>;
}
