import Link from "next/link";
import { notFound } from "next/navigation";
import { Field } from "@/components/admin/forms";
import { AdminForm, ConfirmForm, Flash, SubmitButton } from "@/components/admin/ui";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import type { Team } from "@/db/schema";
import {
  CLASS_ORDER,
  classRank,
  getPlayerSheets,
  getSheetRowsView,
  normalizeClass,
  type SheetRowView,
} from "@/lib/player-sheets";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminSheetEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string; q?: string; __at?: string }>;
}) {
  const { id } = await params;
  const { ok, error, q = "", __at } = await searchParams;
  const sheetId = Number(id);
  const [sheetData, league] = await Promise.all([getPlayerSheets(), getLeagueData()]);
  const sheet = sheetData.sheets.find((item) => item.id === sheetId);
  if (!sheet) notFound();
  const allRows = (await getSheetRowsView(sheetId)).sort(
    (a, b) => classRank(a.playerClass) - classRank(b.playerClass) || a.username.localeCompare(b.username),
  );
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? allRows.filter((row) => `${row.username} ${row.teamLabel} ${row.role} ${row.playerClass}`.toLowerCase().includes(needle))
    : allRows;

  return (
    <>
      <PageHeader
        eyebrow="Admin / Playersheet editor"
        title={<>{sheet.label}<span className="text-orange-400">.</span></>}
        subtitle={`${allRows.length} rows · ${sheet.isVerified ? "verified source" : "draft archive"} · ${sheet.isCurrent ? "current sheet" : "season archive"}`}
        actions={<><Link href={`/sheets?sheet=${sheet.slug}`} className="btn">Public sheet ↗</Link><Link href="/admin/sheets" className="btn">← All sheets</Link></>}
      />
      <Flash ok={ok} error={error} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Sheet settings">
          <AdminForm action="updatePlayerSheet" className="grid gap-4 p-5 sm:grid-cols-2">
            <input type="hidden" name="id" value={sheet.id} />
            <Field label="URL slug"><input name="slug" required defaultValue={sheet.slug} className="input" /></Field>
            <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={sheet.sortOrder} className="input" /></Field>
            <Field label="Sheet name"><input name="label" required defaultValue={sheet.label} className="input" /></Field>
            <Field label="Season"><input name="season" required defaultValue={sheet.season} className="input" /></Field>
            <Field label="Description" className="sm:col-span-2"><input name="description" defaultValue={sheet.description ?? ""} className="input" /></Field>
            <Field label="Original spreadsheet URL" className="sm:col-span-2"><input name="sourceUrl" type="url" defaultValue={sheet.sourceUrl ?? ""} className="input" placeholder="https://docs.google.com/spreadsheets/…" /></Field>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isCurrent" defaultChecked={sheet.isCurrent} className="h-4 w-4 accent-orange-500" />Current sheet</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isVerified" defaultChecked={sheet.isVerified} className="h-4 w-4 accent-orange-500" />Verified source</label>
            <div className="sm:col-span-2"><SubmitButton>Save settings</SubmitButton></div>
          </AdminForm>
        </Panel>

        <Panel title="Paste spreadsheet rows" description="Merge updates matching usernames and keeps other rows. Replace swaps the entire sheet.">
          <AdminForm action="importPlayerSheetRows" resetOnSuccess className="space-y-4 p-5">
            <input type="hidden" name="sheetId" value={sheet.id} />
            <textarea
              name="raw"
              required
              rows={9}
              className="input resize-y font-mono text-xs leading-relaxed"
              placeholder={"Class, Username, Team / Nation, Role, Wage, Penalty, Notes\nX, LivingInLiverpool, Barcelona, PLAYER, 500000\nX, iwannarott, Real Betis, PLAYER, 700000, 200000"}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Column layout" hint="Ignored when a recognised header row is pasted">
                <select name="layout" defaultValue="classFirst" className="input">
                  <option value="classFirst">Class, Username, Team, Role, Wage…</option>
                  <option value="usernameFirst">Username, Team, Role, Wage…</option>
                </select>
              </Field>
              <Field label="Import mode">
                <select name="mode" defaultValue="merge" className="input">
                  <option value="merge">Merge / update usernames</option>
                  <option value="replace">Replace entire sheet</option>
                </select>
              </Field>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">CSV or tab-separated paste. Wages may include $, spaces or commas. Existing Roblox profiles are linked automatically; unknown teams remain as archived text.</p>
            <SubmitButton>Import spreadsheet</SubmitButton>
          </AdminForm>
        </Panel>
      </div>

      <details className="panel mt-6 overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/[0.03]">+ Add one player manually</summary>
        <AdminForm action="addPlayerSheetRow" resetOnSuccess className="grid gap-4 border-t border-white/[0.06] p-5 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="sheetId" value={sheet.id} />
          <Field label="Class"><input name="playerClass" list="sheet-class-options" defaultValue="UNRATED" className="input" /></Field>
          <Field label="Rating"><input name="rating" type="number" min={0} max={99} className="input" placeholder="90" /></Field>
          <Field label="Roblox username"><input name="username" required className="input" /></Field>
          <Field label="Position"><input name="position" className="input" placeholder="ST" /></Field>
          <Field label="Nation / high rank"><input name="nation" className="input" placeholder="Netherlands" /></Field>
          <Field label="Current team"><TeamSelect teams={league.teams} /></Field>
          <Field label="Archived team text" hint="Used if no current team is selected"><input name="teamName" className="input" placeholder="Real Betis" /></Field>
          <Field label="Role"><input name="role" defaultValue="PLAYER" className="input" /></Field>
          <Field label="Wage"><input name="wage" type="number" min={0} className="input" placeholder="500000" /></Field>
          <Field label="Penalty"><input name="penalty" type="number" min={0} className="input" /></Field>
          <Field label="Notes"><input name="notes" className="input" /></Field>
          <div className="sm:col-span-2 lg:col-span-4"><SubmitButton>Add player row</SubmitButton></div>
        </AdminForm>
      </details>

      <Panel
        className="mt-6"
        title="Sheet rows"
        description={`${rows.length} shown · ${allRows.length} total`}
        action={
          <form className="flex gap-2" method="get">
            {__at ? <input type="hidden" name="__at" value={__at} /> : null}
            <input type="search" name="q" defaultValue={q} className="input w-48 py-1.5 text-xs" placeholder="Filter rows…" />
            <button className="btn btn-sm" type="submit">Filter</button>
          </form>
        }
      >
        <datalist id="sheet-class-options">{CLASS_ORDER.map((value) => <option key={value} value={value} />)}</datalist>
        {rows.length ? (
          <div className="max-h-[75vh] overflow-auto">
            <div className="grid min-w-[1290px] grid-cols-[70px_62px_160px_180px_80px_120px_100px_100px_minmax(140px,1fr)_65px_65px] gap-2 border-b border-white/[0.08] bg-[#0b1530] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span>Class</span><span>Rating</span><span>Username</span><span>Team / archived name</span><span>Pos</span><span>Nation</span><span>Role</span><span>Wage</span><span>Penalty / notes</span><span /><span />
            </div>
            {rows.map((row) => <RowEditor key={row.id} row={row} teams={league.teams} />)}
          </div>
        ) : <EmptyState>{allRows.length ? "No rows match this filter." : "No rows yet. Paste the spreadsheet above to populate this sheet."}</EmptyState>}
      </Panel>

      <Panel className="mt-6" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-slate-400">Deleting this sheet permanently removes all of its archived player rows.</p>
          <ConfirmForm action="deletePlayerSheet" hidden={{ id: sheet.id }} message={`Delete ${sheet.label} and all ${allRows.length} rows? This cannot be undone.`}>Delete sheet</ConfirmForm>
        </div>
      </Panel>
    </>
  );
}

function TeamSelect({ teams, value }: { teams: Team[]; value?: number | null }) {
  return (
    <select name="teamId" defaultValue={value ?? ""} className="input">
      <option value="">No current team</option>
      {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
    </select>
  );
}

function RowEditor({ row, teams }: { row: SheetRowView; teams: Team[] }) {
  return (
    <div className="grid min-w-[1290px] grid-cols-[70px_62px_160px_180px_80px_120px_100px_100px_minmax(140px,1fr)_65px_65px] items-center gap-2 border-b border-white/[0.05] px-4 py-2 last:border-b-0 hover:bg-white/[0.02]">
      <AdminForm action="updatePlayerSheetRow" className="contents">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="sheetId" value={row.sheetId} />
        {row.playerId ? <input type="hidden" name="playerId" value={row.playerId} /> : null}
        <input name="playerClass" list="sheet-class-options" defaultValue={normalizeClass(row.playerClass)} className="input px-2 py-1.5 text-xs" aria-label={`Class for ${row.username}`} />
        <input name="rating" type="number" min={0} max={99} defaultValue={row.rating ?? ""} className="input px-2 py-1.5 text-xs" aria-label="Rating" />
        <input name="username" defaultValue={row.username} required className="input px-2 py-1.5 text-xs font-semibold" aria-label="Username" />
        <div className="space-y-1">
          <TeamSelect teams={teams} value={row.teamId} />
          {!row.teamId ? <input name="teamName" defaultValue={row.teamName ?? ""} className="input px-2 py-1 text-[10px]" placeholder="Archived team" aria-label="Archived team name" /> : null}
        </div>
        <input name="position" defaultValue={row.position ?? ""} className="input px-2 py-1.5 text-xs" aria-label="Position" />
        <input name="nation" defaultValue={row.nation ?? ""} className="input px-2 py-1.5 text-xs" aria-label="Nation" />
        <input name="role" defaultValue={row.role} className="input px-2 py-1.5 text-xs" aria-label="Role" />
        <input name="wage" type="number" min={0} defaultValue={row.wage ?? ""} className="input px-2 py-1.5 text-xs" aria-label="Wage" />
        <div className="space-y-1">
          <input name="penalty" type="number" min={0} defaultValue={row.penalty ?? ""} className="input px-2 py-1 text-[10px]" aria-label="Penalty" placeholder="Penalty" />
          <input name="notes" defaultValue={row.notes ?? ""} className="input px-2 py-1 text-[10px]" aria-label="Notes" placeholder="Notes" />
        </div>
        <SubmitButton variant="default" className="btn-sm px-2">Save</SubmitButton>
      </AdminForm>
      <ConfirmForm action="deletePlayerSheetRow" hidden={{ id: row.id, sheetId: row.sheetId }} message={`Remove ${row.username} from this sheet?`}>Delete</ConfirmForm>
    </div>
  );
}
