import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerForm } from "@/components/admin/forms";
import { AdminForm, ConfirmForm, Flash, SubmitButton } from "@/components/admin/ui";
import { PageHeader, Panel, PlayerAvatar } from "@/components/ui";
import { playerLabel } from "@/lib/site";
import { getLeagueData, playerStatLine } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminPlayerEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const data = await getLeagueData();
  const player = data.playerById.get(Number(id));
  if (!player) notFound();
  const team = player.teamId ? data.teamById.get(player.teamId) : null;
  const line = playerStatLine(data, player.id);

  return (
    <>
      <PageHeader
        eyebrow="Admin · Player"
        title={
          <span className="flex items-center gap-3">
            <PlayerAvatar player={player} team={team} size="lg" /> {playerLabel(player)}
          </span>
        }
        subtitle={`${line.apps} apps · ${line.goals} goals · ${line.assists} assists`}
        actions={
          <>
            <Link href={`/players/${player.id}`} className="btn">View public page</Link>
            <Link href="/admin/players" className="btn">← Players</Link>
          </>
        }
      />
      <Flash ok={ok} error={error} />

      <Panel
        title="Roblox account"
        description="Pulls the user id, display name and avatar straight from Roblox"
        action={
          <AdminForm action="resolvePlayerRoblox">
            <input type="hidden" name="id" value={player.id} />
            <SubmitButton variant="default" className="btn-sm">Link Roblox</SubmitButton>
          </AdminForm>
        }
      >
        <div className="flex items-center gap-4 p-5">
          <PlayerAvatar player={player} team={team} size="lg" />
          <dl className="min-w-0 flex-1 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Username</dt><dd className="truncate font-semibold text-white">@{player.name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Roblox ID</dt><dd className="font-mono text-white">{player.robloxUserId ?? "Not linked"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Avatar</dt><dd className="text-white">{player.robloxAvatarUrl ? "Linked" : "Fallback initials"}</dd></div>
          </dl>
        </div>
      </Panel>

      <Panel title="Edit player">
        <div className="p-5">
          <PlayerForm player={player} teams={data.teams} action="updatePlayer" />
        </div>
      </Panel>

      <Panel className="mt-6" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-zinc-400">
            Deleting removes the player&apos;s appearances and awards. Goals they scored stay on record without a scorer.
          </p>
          <ConfirmForm
            action="deletePlayer"
            hidden={{ id: player.id }}
            message={`Delete ${playerLabel(player)}? This cannot be undone.`}
          >
            Delete player
          </ConfirmForm>
        </div>
      </Panel>
    </>
  );
}
