import Link from "next/link";
import { Icon, type IconName } from "@/components/hub/Icon";
import { LeagueImage } from "@/components/hub/LeagueImage";
import { Spotlight } from "@/components/hub/Spotlight";
import { RankingsPreview } from "@/components/hub/RankingsPreview";
import { getHubLeaderboards } from "@/lib/hub";
import { competitionLabel, seasons } from "@/lib/site";
import { computeStandings, getLeagueData, recentResults, upcomingFixtures } from "@/lib/stats";
import { MatchList } from "@/components/MatchRow";
import { StandingsTable } from "@/components/StandingsTable";
import type { SiteContent } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "League overview", description: "Your RSL Tracker matchcentre: explore the EUROS, scout the league, and follow every season." };

const shortcuts: {label: string; desc: string; href: string; icon: IconName; tag: string}[] = [
  {label:'Playersheets', desc:'Season rosters, classes and contracts.', href:'/sheets', icon:'sheet', tag:'DATABASE'},
  {label:'Transfer centre', desc:'Trace every recorded club switch.', href:'/transfers', icon:'transfer', tag:'CLUB HISTORY'},
  {label:'RSL Arcade', desc:'Draft a squad. Put your league knowledge to the test.', href:'/play', icon:'joystick', tag:'PLAY'},
];

export default async function HomePage() {
  const [data, boards] = await Promise.all([getLeagueData(), getHubLeaderboards()]);
  const current = data.competitions.find(c => c.status === 'ongoing' && c.name === 'EUROS') ?? data.competitions.find(c => c.status === 'ongoing');
  const competitionHref = current ? `/competitions/${current.id}` : '/competitions';
  const matchHref = current ? `/matches?comp=${current.id}` : '/matches';
  const seasonTag = current?.season?.match(/\d+/)?.[0]?.padStart(2,'0');
  const chapters = seasons.filter(s => data.competitions.some(c => c.season === s.season));
  const chapterCount = new Set(data.competitions.flatMap(c => c.season ? [c.season] : [])).size;
  const fixtures = upcomingFixtures(data,2);
  const results = recentResults(data,3);
  const table = current ? computeStandings(data,current.id) : [];
  const artwork = data.activeContent.find(c => c.kind === 'hero' && c.imageUrl !== '/images/rsl-euros-crest.png');
  const recentTitles = [...data.placements].filter(p => p.placement === 1)
    .map(p => ({ team: data.teamById.get(p.teamId), competition: data.competitionById.get(p.competitionId) }))
    .filter(x => x.team && x.competition)
    .sort((a,b) => (b.competition?.season || '').localeCompare(a.competition?.season || '', 'en', {numeric: true}) || (b.competition?.id || 0) - (a.competition?.id || 0)).slice(0,3);
  const gallery = data.activeContent.filter(c => c.kind !== 'hero');
  const metrics: {label:string; value:number; href:string; icon:IconName; tone:string}[] = [
    {label:'Registered players', value:data.players.length, href:'/players', icon:'players', tone:'orange'},
    {label:'Teams tracked', value:data.teams.length, href:'/teams', icon:'club', tone:'blue'},
    {label:'Competitions', value:data.competitions.length, href:'/competitions', icon:'trophy', tone:'gold'},
    {label:'Seasons on record', value:chapterCount, href:'/archive', icon:'layers', tone:'violet'},
  ];
  return <div className="league-hub">
    <header className="hub-masthead">
      <div><p className="section-kicker masthead-kicker"><span/> League control room</p><h1>League overview<span>.</span></h1></div>
      <div className="system-line"><span className="online-badge"><i/> Tracker online</span><time dateTime={new Date().toISOString().slice(0,10)}>{new Intl.DateTimeFormat('en-GB',{day:'2-digit', month:'short', year:'numeric', timeZone:'UTC'}).format(new Date())}</time></div>
    </header>

    <Spotlight competitionHref={competitionHref} matchHref={matchHref} currentLabel={seasonTag ? `Season ${seasonTag}` : 'RSL Tracker'} imageOverride={artwork?.imageUrl}/>

    <nav className="hub-metrics" aria-label="League database at a glance">{metrics.map(m => <Link className={`hub-metric metric-${m.tone}`} href={m.href} key={m.href}>
      <span className="metric-icon"><Icon name={m.icon} size={22}/></span><div><strong>{String(m.value).padStart(2,'0')}</strong><span>{m.label}</span></div><Icon name="diagonal" size={13} className="metric-arrow"/>
    </Link>)}</nav>

    <div className="overview-grid">
      <RankingsPreview boards={boards}/>
      <section className="hub-panel season-panel" aria-labelledby="season-heading">
        <div className="hub-panel-heading"><div><p className="section-kicker"><span/> League timeline</p><h2 id="season-heading">Season navigator</h2></div><span className="panel-glyph"><Icon name="history" size={20}/></span></div>
        <div className="season-list">{[...chapters].reverse().map(s => {
          const here = current?.season === s.season;
          const count = data.competitions.filter(c => c.season === s.season).length;
          return <Link key={s.season} href={here ? competitionHref : `/archive#season-${s.number}`} className={`season-item season-${s.number} ${here ? 'in-season' : ''}`}>
            <span className="season-ticket"><small>SEASON</small><b>{s.number}</b></span>
            <span className="season-copy"><span className="season-name">{s.era}{here && <span className="current-chip"><i/>Current</span>}</span><small>{here ? 'Netherlands × Belgium' : `${count} competitions · Archived`}</small></span>
            <Icon name="right" size={15}/>
          </Link>;
        })}</div>
        <Link href="/archive" className="season-foot">Explore the season archive <Icon name="arrow" size={15}/></Link>
      </section>
    </div>

    <section className="hub-access" aria-labelledby="explore-heading">
      <div className="hub-section-heading"><div><p className="section-kicker"><span/> Quick access</p><h2 id="explore-heading">Explore the tracker</h2></div><span className="section-rule"/></div>
      <div className="hub-shortcuts">{shortcuts.map((s,i) => <Link href={s.href} key={s.href} className={`shortcut-card shortcut-${i}`}>
        <div className="shortcut-top"><span className="shortcut-icon"><Icon name={s.icon} size={22}/></span><small>{s.tag}</small><Icon name="diagonal" size={14}/></div><h3>{s.label}</h3><p>{s.desc}</p>
      </Link>)}</div>
    </section>

    <div className="overview-grid match-grid">
      <section className="hub-panel"><div className="hub-panel-heading"><div><p className="section-kicker"><span/> On the pitch</p><h2>Table</h2></div><Link href={competitionHref} className="hub-text-link">{current ? competitionLabel(current) : 'Competitions'}<Icon name="diagonal" size={13}/></Link></div>
        {table.length ? <StandingsTable data={data} standings={table} compact/> : <p className="hub-empty">The table opens when teams are registered.</p>}
        <div className="rank-table-foot"><Icon name="pitch" size={14}/> Based on completed matches</div>
      </section>
      <section className="hub-panel"><div className="hub-panel-heading"><div><p className="section-kicker"><span/> Match centre</p><h2>Next fixtures</h2></div><Icon name="calendar" size={20} className="panel-glyph"/></div>
        {fixtures.length ? <MatchList matches={fixtures} data={data}/> : <div className="fixture-empty"><span><Icon name="calendar" size={22}/></span><div><b>Fixtures to be announced</b><p>The next matchdays will appear here when scheduled.</p></div></div>}
        <Link className="season-foot" href="/matches">Open match centre <Icon name="arrow" size={15}/></Link>
      </section>
    </div>
    {recentTitles.length > 0 && <section className="hub-access" aria-label="Trophy cabinet"><div className="hub-section-heading"><div><p className="section-kicker"><span/> Archive honours</p><h2>Trophy cabinet</h2></div><span className="section-rule"/><Link className="hub-text-link" href="/archive">All honours <Icon name="diagonal" size={13}/></Link></div><div className="hub-titles">{recentTitles.map(({team,competition}) => team && competition ? <Link key={competition.id} href={`/competitions/${competition.id}`} className="hub-title-card">
      <span className="title-art">{competition.badgeUrl ? <LeagueImage src={competition.badgeUrl} size={42}/> : <Icon name="trophy" size={25}/>}</span><span><small>{competition.season} / Winners</small><b>{competition.name}</b><em>{team.name}</em></span><Icon name="diagonal" size={13}/>
    </Link> : null)}</div></section>}
    {results.length > 0 && <section className="hub-panel results-section"><div className="hub-panel-heading"><h2>Latest results</h2><Link href="/matches?status=played" className="hub-text-link">All results <Icon name="diagonal" size={13}/></Link></div><MatchList matches={results} data={data} showScorers/></section>}
    {gallery.length > 0 && <section className="hub-access"><div className="hub-section-heading"><div><p className="section-kicker"><span/> RSL media</p><h2>From the community</h2></div><span className="section-rule"/></div><div className="hub-gallery">{gallery.map(item => <ContentCard key={item.id} item={item}/>)}</div></section>}
  </div>;
}
function ContentCard({item}:{item: SiteContent}) {
  const href = item.linkUrl && (/^https?:\/\//.test(item.linkUrl) || /^\/(?!\/)/.test(item.linkUrl)) ? item.linkUrl : null;
  return <article className="hub-panel media-card"><div className="media-visual"><LeagueImage src={item.imageUrl} alt={item.title} cover/></div><div><p className="section-kicker">{item.season} / {item.kind === 'totw-team' ? 'Team of the Season' : item.kind === 'totw' ? 'Team of the Week' : 'Community artwork'}</p><h3>{item.title}</h3>{item.caption && <p>{item.caption}</p>}{href && <a href={href} target={href.startsWith('/') ? undefined : '_blank'} rel="noreferrer" className="hub-text-link">View feature <Icon name="diagonal" size={13}/></a>}</div></article>;
}
