import Link from "next/link";
import { Field } from "@/components/admin/forms";
import { AdminForm, ConfirmForm, Flash, SubmitButton } from "@/components/admin/ui";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { SITE_CONTENT_KINDS, type SiteContent } from "@/db/schema";
import type { AdminActionName } from "@/lib/admin-action-names";
import { getLeagueData } from "@/lib/stats";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<SiteContent["kind"], string> = {
  gfx: "GFX / media",
  totw: "Team of the Week",
  "totw-team": "Team of the Season",
  hero: "Hero artwork",
  custom: "Custom block",
};

function ContentForm({ content, action }: { content?: SiteContent; action: AdminActionName }) {
  return (
    <AdminForm action={action} resetOnSuccess={!content} className="grid gap-4 sm:grid-cols-2">
      {content ? <input type="hidden" name="id" value={content.id} /> : null}
      <Field label="Title">
        <input name="title" required defaultValue={content?.title ?? ""} className="input" placeholder="Team of the Season · S3" />
      </Field>
      <Field label="Section" hint="Controls where it appears on the overview">
        <select name="kind" defaultValue={content?.kind ?? "gfx"} className="input">
          {SITE_CONTENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>{KIND_LABELS[kind]}</option>
          ))}
        </select>
      </Field>
      <Field label="Image" hint="Path such as /images/teams/ac-milan.png or a full HTTPS image URL" className="sm:col-span-2">
        <input name="imageUrl" required defaultValue={content?.imageUrl ?? ""} className="input" placeholder="/images/gfx/tots-season-3.png" />
      </Field>
      <Field label="Link (optional)" className="sm:col-span-2">
        <input name="linkUrl" defaultValue={content?.linkUrl ?? ""} className="input" placeholder="https://example.com/post" />
      </Field>
      <Field label="Caption">
        <input name="caption" defaultValue={content?.caption ?? ""} className="input" placeholder="Selected by the RSL panel" />
      </Field>
      <Field label="Season">
        <input name="season" defaultValue={content?.season ?? ""} className="input" placeholder="Season 3" />
      </Field>
      <Field label="Sort order" hint="Lower numbers appear first">
        <input name="sortOrder" type="number" defaultValue={content?.sortOrder ?? 0} className="input" />
      </Field>
      <label className="flex items-center gap-2 self-end text-sm text-slate-300">
        <input type="checkbox" name="isActive" defaultChecked={content?.isActive ?? true} className="h-4 w-4 accent-orange-500" />
        Show on the overview
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>{content ? "Save content" : "Publish to overview"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const data = await getLeagueData();

  return (
    <>
      <PageHeader
        eyebrow="Admin / Site content"
        title={<>Images & <span className="text-orange-400">GFX.</span></>}
        subtitle="Add artwork to the main overview — GFX drops, Team of the Season, hero images or anything else. Everything is editable or removable at any time."
        actions={<Link href="/" className="btn">View overview ↗</Link>}
      />
      <Flash ok={ok} error={error} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Add a new image block" className="lg:col-span-2">
          <div className="p-5">
            <ContentForm action="createContent" />
          </div>
        </Panel>

        <Panel title="Published content" description={`${data.content.length} blocks`} className="lg:col-span-3">
          {data.content.length ? (
            <div className="divide-y divide-white/[0.06]">
              {data.content.map((item) => (
                <div key={item.id} className="flex gap-4 p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" className="h-24 w-32 shrink-0 rounded-lg border border-white/10 object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip chip-orange">{KIND_LABELS[item.kind]}</span>
                      {!item.isActive ? <span className="chip chip-red">Hidden</span> : null}
                      {item.season ? <span className="chip">{item.season}</span> : null}
                      <span className="chip">#{item.sortOrder}</span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-bold text-white">{item.title}</p>
                    {item.caption ? <p className="truncate text-xs text-slate-400">{item.caption}</p> : null}
                    <p className="mt-1 truncate text-[11px] text-slate-600">{item.imageUrl}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminForm action="toggleContent">
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton variant="default" className="btn-sm">{item.isActive ? "Hide" : "Publish"}</SubmitButton>
                      </AdminForm>
                      <ConfirmForm action="deleteContent" hidden={{ id: item.id }} message={`Remove “${item.title}” from the overview?`}>
                        Delete
                      </ConfirmForm>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No content yet. Add your first GFX block on the left.</EmptyState>
          )}
        </Panel>
      </div>

      {data.content.some((c) => c.kind === "totw-team") ? (
        <Panel className="mt-6" title="Edit Team of the Season blocks">
          <div className="grid gap-6 md:grid-cols-2">
            {data.content.filter((c) => c.kind === "totw-team").map((item) => (
              <Panel key={item.id} title={item.title}>
                <div className="p-5"><ContentForm content={item} action="updateContent" /></div>
              </Panel>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel className="mt-6" title="Image tips">
        <ul className="list-decimal space-y-2 p-5 pl-10 text-sm text-slate-400">
          <li>Drop files into the project&apos;s <code className="text-orange-300">public/images</code> folder and reference them as <code className="text-orange-300">/images/your-file.png</code>.</li>
          <li>Any HTTPS image URL works too — Discord CDN links, Imgur or your own host.</li>
          <li>Landscape images (16:9) look best for Team of the Season and GFX blocks.</li>
          <li>Set a sort order to control the order blocks appear in on the overview.</li>
        </ul>
      </Panel>
    </>
  );
}
