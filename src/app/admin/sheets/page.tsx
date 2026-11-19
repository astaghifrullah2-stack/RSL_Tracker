import Link from "next/link";
import { Field } from "@/components/admin/forms";
import { AdminForm, Flash, SubmitButton } from "@/components/admin/ui";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { getPlayerSheets } from "@/lib/player-sheets";

export const dynamic = "force-dynamic";

export default async function AdminSheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getPlayerSheets();

  return (
    <>
      <PageHeader
        eyebrow="Admin / Playersheets"
        title={<>Sheet <span className="text-orange-400">archives.</span></>}
        subtitle="Create a season sheet, paste the original spreadsheet, and preserve its classes, teams, roles and wages. The public archive starts at S2."
        actions={<Link href="/sheets" className="btn">View public sheets ↗</Link>}
      />
      <Flash ok={ok} error={error} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Create a playersheet" className="lg:col-span-2">
          <AdminForm action="createPlayerSheet" className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="URL slug" hint="Lowercase, e.g. s2">
              <input name="slug" required className="input" placeholder="s2" />
            </Field>
            <Field label="Sort order">
              <input name="sortOrder" type="number" defaultValue={2} className="input" />
            </Field>
            <Field label="Sheet name" className="sm:col-span-2">
              <input name="label" required className="input" placeholder="S2 Playersheet" />
            </Field>
            <Field label="Season" className="sm:col-span-2">
              <input name="season" required className="input" placeholder="Season 2" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <input name="description" className="input" placeholder="S2 archived playersheet" />
            </Field>
            <Field label="Original sheet URL" className="sm:col-span-2">
              <input name="sourceUrl" type="url" className="input" placeholder="https://docs.google.com/spreadsheets/…" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isCurrent" className="h-4 w-4 accent-orange-500" />Current sheet</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isVerified" className="h-4 w-4 accent-orange-500" />Verified source</label>
            <div className="sm:col-span-2"><SubmitButton>Create sheet</SubmitButton></div>
          </AdminForm>
        </Panel>

        <Panel title="All playersheets" description={`${data.sheets.length} seasons`} className="lg:col-span-3">
          {data.sheets.length ? (
            <div className="divide-y divide-white/[0.06]">
              {data.sheets.map((sheet) => {
                const count = data.rowsBySheet.get(sheet.id)?.length ?? 0;
                return (
                  <div key={sheet.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-sm font-black text-orange-300">
                      {sheet.slug.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-white">{sheet.label}</p>
                        {sheet.isCurrent ? <span className="chip chip-orange">CURRENT</span> : <span className="chip">ARCHIVE</span>}
                        {sheet.isVerified ? <span className="chip chip-amber">VERIFIED</span> : <span className="chip">DRAFT</span>}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{count} rows · {sheet.season}{sheet.sourceUrl ? " · source linked" : " · no source link"}</p>
                    </div>
                    <Link href={`/sheets?sheet=${sheet.slug}`} className="btn btn-sm">View</Link>
                    <Link href={`/admin/sheets/${sheet.id}`} className="btn btn-sm btn-primary">Edit / import</Link>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState>No sheets yet. Create S2 on the left to begin the archive.</EmptyState>}
        </Panel>
      </div>

      <Panel className="mt-6" title="Spreadsheet format">
        <div className="grid gap-5 p-5 text-sm text-slate-400 md:grid-cols-2">
          <div>
            <p className="font-bold text-white">Class-first columns</p>
            <code className="mt-2 block rounded-lg bg-black/30 p-3 text-xs text-orange-200">X, LivingInLiverpool, Barcelona, PLAYER, 500000<br />X, iwannarott, Real Betis, PLAYER, 700000, 200000</code>
          </div>
          <div>
            <p className="font-bold text-white">Or paste a header row</p>
            <code className="mt-2 block rounded-lg bg-black/30 p-3 text-xs text-orange-200">Class, Username, Team / Nation, Role, Wage, Penalty, Notes</code>
            <p className="mt-2 text-xs">CSV and tab-separated paste both work. Unknown teams are preserved as archive text, not silently discarded.</p>
          </div>
        </div>
      </Panel>
    </>
  );
}
