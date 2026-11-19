"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import { LeagueImage } from "./LeagueImage";
import { WatchButton } from "./Watchlist";
import type { LeaderBoard } from "@/lib/hub-types";

export function RankingsPreview({ boards }: { boards: LeaderBoard[] }) {
  const [selected,setSelected] = useState<LeaderBoard['id']>('index');
  const board = boards.find(x => x.id === selected) || boards[0];
  return <section className="hub-panel rankings-preview" aria-labelledby="leader-heading">
    <div className="hub-panel-heading"><div><p className="section-kicker"><span/> Scouting desk</p><h2 id="leader-heading">Player rankings</h2></div><Link className="hub-text-link" href={board.href}>Full rankings <Icon name="diagonal" size={13}/></Link></div>
    <div className="rank-tabs" role="group" aria-label="Ranking metric">{boards.map(b => <button key={b.id} type="button" aria-pressed={selected === b.id} className={selected === b.id ? "selected" : ""} onClick={() => setSelected(b.id)}>{b.label}</button>)}<span className="rank-period"><i/>{board.source}</span></div>
    <div className="rank-table-scroll"><table className="hub-rank-table"><thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col" className="club-col">Team</th><th scope="col" className="score-col">{board.unit}</th><th scope="col"><span className="sr-only">Watchlist</span></th></tr></thead><tbody>
      {board.rows.map(p => <tr key={p.id}>
        <td><span className={`rank-number ${p.rank === 1 ? 'rank-first' : ''}`}>{String(p.rank).padStart(2,'0')}</span></td>
        <td><Link href={`/players/${p.id}`} className="leader-player"><LeagueImage src={p.avatar} username={p.name}/><span><b>{p.name}</b><small>{p.position}{p.className ? ` · ${p.className} class` : ''}</small></span></Link></td>
        <td className="club-col"><span>{p.club}</span></td><td className="score-col"><span className="leader-score">{p.value}</span></td><td><WatchButton playerId={p.id} username={p.name} compact/></td>
      </tr>)}
    </tbody></table></div>
    {!board.rows.length && <p className="hub-empty">{board.id === "goals" ? "No goals recorded yet. Scorers appear here when a match result is entered." : "No player records for this board yet."}</p>}
    <div className="rank-table-foot"><span className="micro-dot"/> Based on recorded league data</div>
  </section>;
}
