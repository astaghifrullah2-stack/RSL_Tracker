import Link from "next/link";
import { ConfirmForm, Flash } from "@/components/admin/ui";
import { PageHeader, Panel, StatCard } from "@/components/ui";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/admin/teams", title: "Teams", text: "Create clubs, set colours, abbreviations and managers." },
  { href: "/admin/players", title: "Players", text: "Register Roblox users, assign teams, positions and numbers." },
  { href: "/admin/sheets", title: "Playersheets", text: "Import S2–S4 spreadsheets, classes, roles, wages and source links." },
  { href: "/admin/content", title: "Images & GFX", text: "Publish Team of the Season, GFX and custom overview artwork." },
  { href: "/admin/competitions", title: "Competitions", text: "League seasons, cups and friendlies." },
  { href: "/admin/matches", title: "Matches", text: "Fixtures, results, lineups, scorers and MOTM." },
  { href: "/admin/trophies", title: "Trophies", text: "Team silverware and individual awards." },
];

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const played = data.matches.filter((m) => m.status === "played").length;
  const empty = data.teams.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Admin dashboard"
        subtitle="Everything on the public site is generated from the data you enter here. Stats, standings and records update instantly."
      />
      <Flash ok={ok} error={error} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Teams" value={data.teams.length} />
        <StatCard label="Players" value={data.players.length} />
        <StatCard label="Competitions" value={data.competitions.length} />
        <StatCard label="Matches" value={`${played}/${data.matches.length}`} hint="played / total" />
        <StatCard label="Trophies" value={data.trophies.length} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="panel block p-5 transition hover:border-orange-500/40 hover:bg-white/[0.04]"
          >
            <h2 className="text-base font-extrabold text-white">{l.title} →</h2>
            <p className="mt-1 text-sm text-zinc-400">{l.text}</p>
          </Link>
        ))}
      </div>

      <Panel className="mt-8" title="Data tools" description="Handy for getting started or starting over.">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Load the RSL season archive</p>
              <p className="text-xs text-zinc-500">
                Imports the verified S1–S3 winners and runners-up plus the current S4 EUROS. No match scores or player stats are invented.
                {empty ? "" : " Only available when the database is empty."}
              </p>
            </div>
            {empty ? (
              <ConfirmForm
                action="seedArchiveAction"
                hidden={{}}
                message="Load the RSL Season 1–4 archive into this empty tracker?"
                variant="primary"
              >
                Load RSL archive
              </ConfirmForm>
            ) : <span className="chip">Archive already loaded</span>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <div>
              <p className="text-sm font-semibold text-white">Clear all data</p>
              <p className="text-xs text-zinc-500">
                Permanently deletes every team, player, competition, match and trophy. Cannot be undone.
              </p>
            </div>
            <ConfirmForm
              action="clearAllAction"
              hidden={{}}
              message="This will permanently delete ALL data in the tracker. Are you absolutely sure?"
            >
              Clear everything
            </ConfirmForm>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6" title="How to record a match">
        <ol className="list-decimal space-y-2 p-5 pl-10 text-sm text-zinc-400">
          <li>Create the competition (e.g. “EUROS · Season 4”) and make sure both teams and their players exist.</li>
          <li>Go to <Link href="/admin/matches" className="link font-semibold">Matches</Link>, create the fixture and set the status to <em>Played</em> with the final score.</li>
          <li>On the match page, tick the players who played for each side (this powers appearances and clean sheets).</li>
          <li>Add each goal with its scorer, assist and minute, then pick the Man of the Match.</li>
          <li>Stats, standings and records update across the whole site automatically.</li>
        </ol>
      </Panel>
    </>
  );
}
