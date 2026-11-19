"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import { LeagueImage } from "./LeagueImage";

export function Spotlight({ competitionHref, matchHref, currentLabel, imageOverride }: { competitionHref: string; matchHref: string; currentLabel: string; imageOverride?: string | null }) {
  const [slide, setSlide] = useState(0);
  const slides = [
    { image: imageOverride || '/images/hub/euros-stadium.jpg', tag: 'Featured competition', chapter: currentLabel, title: 'RSL', accent: 'EUROS', host: true, description: 'The international chapter. Follow every squad, fixture and result.', cta: 'Tournament hub', href: competitionHref, second: 'View fixtures', secondHref: matchHref },
    { image: '/images/hub/season-archive.jpg', tag: 'From the archive', chapter: 'Season 03', title: 'ITALIAN', accent: 'LEAGUE', host: false, description: 'Revisit the Serie A title race, the cup winners and their squads.', cta: 'Explore season 3', href: '/archive#season-03', second: 'All competitions', secondHref: '/competitions' },
    { image: '/images/hub/arcade-ball.jpg', tag: 'RSL Arcade', chapter: 'Play the league', title: 'YOUR', accent: 'DREAM XI', host: false, description: 'Pick your formation and build a squad from the RSL player database.', cta: 'Build a squad', href: '/play/squad-builder', second: 'Games hub', secondHref: '/play' },
  ];
  const item = slides[slide];
  const step = (dir: number) => setSlide((v) => (v + dir + slides.length) % slides.length);
  return <section className={`hub-spotlight slide-${slide}`} aria-roledescription="carousel" aria-label="League spotlight" onKeyDown={e => { if (e.key === 'ArrowLeft') {e.preventDefault();step(-1);} if (e.key === 'ArrowRight') {e.preventDefault();step(1);} }}>
    {item.image.startsWith('/images/hub/') ? <Image key={item.image} src={item.image} alt="" fill priority={slide === 0} sizes="(max-width: 700px) 100vw, (max-width: 1500px) 94vw, 1360px" className="spotlight-photo"/> : <LeagueImage src={item.image} cover className="spotlight-photo"/>}
    <div className="spotlight-shade"/>
    <div className="spotlight-copy" aria-live="polite">
      <div className="spotlight-meta"><span className="feature-tag"><i/>{item.tag}</span><span className="feature-season">{item.chapter}</span></div>
      <h2>{item.title} <em>{item.accent}</em></h2>
      {item.host ? <div className="spotlight-hosts"><span className="flag-mini flag-nl"/>Netherlands <b>×</b><span className="flag-mini flag-be"/>Belgium</div> : <div className="spotlight-hosts secondary-host"><Icon name={slide === 1 ? "archive" : "pitch"} size={16}/>{slide === 1 ? "The Italian chapter" : "RSL Squad Builder"}</div>}
      <p>{item.description}</p>
      <div className="spotlight-actions"><Link className="hub-primary" href={item.href}>{item.cta}<Icon name="arrow" size={16}/></Link><Link className="hub-ghost" href={item.secondHref}>{item.second}<Icon name="diagonal" size={14}/></Link></div>
    </div>
    <div className="spotlight-index"><span>{String(slide + 1).padStart(2,'0')}</span><div>{slides.map((s,i) => <button type="button" key={s.title} aria-label={`Show ${s.title} ${s.accent}`} aria-current={slide === i ? 'true' : undefined} className={slide === i ? 'selected' : ''} onClick={() => setSlide(i)}/>)}</div><span>03</span></div>
    <div className="spotlight-arrows"><button type="button" aria-label="Previous spotlight" onClick={() => step(-1)}><Icon name="left" size={17}/></button><button type="button" aria-label="Next spotlight" onClick={() => step(1)}><Icon name="right" size={17}/></button></div>
  </section>;
}
