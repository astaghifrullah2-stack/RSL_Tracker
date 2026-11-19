import { cn } from "@/lib/site";
import type { LeagueData, TeamRecord } from "@/lib/stats";
import { FormPips, TeamLink } from "@/components/ui";

export function StandingsTable({
  standings,
  data,
  highlightTeamId,
  compact = false,
}: {
  standings: TeamRecord[];
  data: LeagueData;
  highlightTeamId?: number;
  compact?: boolean;
}) {
  if (!standings.length) {
    return (
      <p className="px-6 py-10 text-center text-sm text-zinc-500">
        No teams registered for this competition yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th className="w-10 text-center">#</th>
            <th>Team</th>
            <th className="text-center">P</th>
            <th className="text-center">W</th>
            <th className="text-center">D</th>
            <th className="text-center">L</th>
            {!compact ? (
              <>
                <th className="text-center">GF</th>
                <th className="text-center">GA</th>
              </>
            ) : null}
            <th className="text-center">GD</th>
            <th className="text-center">Pts</th>
            {!compact ? <th>Form</th> : null}
          </tr>
        </thead>
        <tbody>
          {standings.map((r, i) => {
            const team = data.teamById.get(r.teamId);
            const hl = highlightTeamId === r.teamId;
            return (
              <tr key={r.teamId} className={cn(hl && "bg-orange-500/[0.06]")}>
                <td className="text-center">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black",
                      i === 0 ? "bg-orange-500/20 text-orange-300" : "text-zinc-500",
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td>
                  <TeamLink team={team} bold />
                </td>
                <td className="text-center tabular-nums text-zinc-300">{r.played}</td>
                <td className="text-center tabular-nums text-zinc-300">{r.wins}</td>
                <td className="text-center tabular-nums text-zinc-300">{r.draws}</td>
                <td className="text-center tabular-nums text-zinc-300">{r.losses}</td>
                {!compact ? (
                  <>
                    <td className="text-center tabular-nums text-zinc-300">{r.gf}</td>
                    <td className="text-center tabular-nums text-zinc-300">{r.ga}</td>
                  </>
                ) : null}
                <td
                  className={cn(
                    "text-center tabular-nums font-semibold",
                    r.gd > 0 ? "text-orange-300" : r.gd < 0 ? "text-red-300" : "text-zinc-400",
                  )}
                >
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </td>
                <td className="text-center tabular-nums text-base font-black text-white">
                  {r.points}
                </td>
                {!compact ? (
                  <td>
                    <FormPips form={r.form} />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
