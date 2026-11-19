import Link from "next/link";
import type { ReactNode } from "react";
import type { Competition, Match, Player, Team } from "@/db/schema";
import { TrophyArt } from "@/components/TrophyArt";
import {
  cn,
  competitionStatusLabels,
  competitionTypeLabels,
  initials,
  playerLabel,
} from "@/lib/site";
import type { FormResult } from "@/lib/stats";

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="muted mt-3 max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
            {description ? <p className="mt-1 text-xs text-zinc-500">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-12 text-center text-sm text-zinc-500", className)}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="panel px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl",
          accent ? "text-orange-400" : "text-white",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team & player identity
// ---------------------------------------------------------------------------
export function TeamCrest({
  team,
  size = "md",
  className,
}: {
  team: (Pick<Team, "shortName" | "primaryColor" | "secondaryColor"> & Partial<Pick<Team, "badgeUrl" | "kind">>) | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "h-5 w-5 text-[7px]",
    sm: "h-7 w-7 text-[9px]",
    md: "h-10 w-10 text-[11px]",
    lg: "h-14 w-14 text-sm",
    xl: "h-20 w-20 text-lg",
  } as const;
  const primary = team?.primaryColor ?? "#52525b";
  const secondary = team?.secondaryColor ?? "#18181b";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black uppercase tracking-tight ring-1 ring-offset-2 ring-offset-[#070e22]",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${secondary}, ${primary}88, #0c1733)`,
        color: "#fff",
        boxShadow: `0 0 0 1px ${primary}55, 0 0 18px ${primary}22`,
        ["--tw-ring-color" as string]: `${primary}99`,
        textShadow: "0 1px 2px rgba(0,0,0,.6)",
      }}
      title={team?.shortName}
    >
      {team?.badgeUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.badgeUrl}
          alt=""
          loading="lazy"
          className={cn(
            "h-full w-full",
            team.kind === "nation" ? "object-cover" : "object-contain p-[2px]",
          )}
        />
      ) : team?.shortName ?? "?"}
    </span>
  );
}

export function TeamLink({
  team,
  size = "sm",
  className,
  bold,
}: {
  team: Team | null | undefined;
  size?: "xs" | "sm" | "md";
  className?: string;
  bold?: boolean;
}) {
  if (!team) return <span className="text-zinc-500">Unknown team</span>;
  return (
    <Link
      href={`/teams/${team.id}`}
      className={cn("inline-flex items-center gap-2 link", bold && "font-semibold", className)}
    >
      <TeamCrest team={team} size={size} />
      <span className="truncate">{team.name}</span>
    </Link>
  );
}

export function PlayerAvatar({
  player,
  team,
  size = "md",
  className,
}: {
  player: Pick<Player, "name" | "displayName"> & Partial<Pick<Player, "robloxAvatarUrl">>;
  team?: Pick<Team, "primaryColor" | "secondaryColor"> | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
    "2xl": "h-28 w-28 text-2xl",
  } as const;
  const primary = team?.primaryColor ?? "#ff7518";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-black text-white",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${primary}2b, ${primary}0d)`,
        border: `1px solid ${primary}55`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          player.robloxAvatarUrl ||
          `/api/roblox/avatar-image?userId=${(player as { robloxUserId?: string | null }).robloxUserId || ""}&username=${encodeURIComponent(player.name)}`
        }
        alt={player.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function TrophyBadge({
  name,
  kind,
  imageUrl,
  icon,
  size = "md",
  className,
}: {
  name: string;
  kind?: string;
  imageUrl?: string | null;
  icon?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { xs: "h-6 w-6", sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        title={name}
        loading="lazy"
        className={cn("shrink-0 object-contain", sizes[size], className)}
      />
    );
  }
  if (icon && icon !== "🏆") {
    return <span className={cn("shrink-0 leading-none", sizes[size])}>{icon}</span>;
  }
  return (
    <span className={cn("inline-flex shrink-0", sizes[size])} title={name}>
      <TrophyArt name={name} kind={kind} />
    </span>
  );
}

export function TrophyChip({ name, kind, imageUrl }: { name: string; kind?: string; imageUrl?: string | null }) {
  return (
    <span className="chip">
      <span className="h-4 w-4">
        <TrophyArt name={name} kind={kind} imageUrl={imageUrl} />
      </span>
      {name}
    </span>
  );
}

export function PlayerLink({
  player,
  team,
  className,
  showAvatar = false,
}: {
  player: Player | null | undefined;
  team?: Team | null;
  className?: string;
  showAvatar?: boolean;
}) {
  if (!player) return <span className="text-zinc-500">Unknown</span>;
  return (
    <Link
      href={`/players/${player.id}`}
      className={cn("inline-flex items-center gap-2 font-semibold link", className)}
    >
      {showAvatar ? <PlayerAvatar player={player} team={team} size="sm" /> : null}
      <span className="truncate">{playerLabel(player)}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
export function PositionBadge({ position }: { position: Player["position"] }) {
  const tone = {
    GK: "chip-amber",
    DEF: "chip-blue",
    MID: "chip-green",
    FWD: "chip-red",
  }[position];
  return <span className={cn("chip", tone)}>{position}</span>;
}

export function CompetitionIcon({
  competition,
  size = "md",
}: {
  competition: Pick<Competition, "name" | "badgeUrl" | "type"> | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-9 w-9 text-base", md: "h-12 w-12 text-xl", lg: "h-16 w-16 text-2xl" };
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#18254a]", sizes[size])}>
      {competition?.badgeUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={competition.badgeUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
      ) : competition?.type === "league" ? "✦" : "🏆"}
    </span>
  );
}

export function CompetitionTypeBadge({ type }: { type: Competition["type"] }) {
  const tone = { league: "chip-blue", cup: "chip-amber", tournament: "chip-orange", friendly: "chip" }[type];
  return <span className={cn("chip", tone)}>{competitionTypeLabels[type]}</span>;
}

export function CompetitionStatusBadge({ status }: { status: Competition["status"] }) {
  const tone = { upcoming: "chip-blue", ongoing: "chip-green", completed: "chip" }[status];
  return <span className={cn("chip", tone)}>{competitionStatusLabels[status]}</span>;
}

export function MatchStatusBadge({ status }: { status: Match["status"] }) {
  const label = { scheduled: "Scheduled", played: "Full time", postponed: "Postponed" }[status];
  const tone = { scheduled: "chip-blue", played: "chip-green", postponed: "chip-red" }[status];
  return <span className={cn("chip", tone)}>{label}</span>;
}

export function FormPips({ form }: { form: FormResult[] }) {
  if (!form.length) return <span className="text-xs text-zinc-600">—</span>;
  return (
    <span className="inline-flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-black",
            r === "W" && "bg-orange-500/25 text-orange-300",
            r === "D" && "bg-zinc-500/25 text-zinc-300",
            r === "L" && "bg-red-500/25 text-red-300",
          )}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

export function ResultPill({ result }: { result: FormResult | null }) {
  if (!result) return <span className="text-zinc-600">—</span>;
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black",
        result === "W" && "bg-orange-500/25 text-orange-300",
        result === "D" && "bg-zinc-500/25 text-zinc-300",
        result === "L" && "bg-red-500/25 text-red-300",
      )}
    >
      {result}
    </span>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
        rank === 1 && "bg-amber-400/20 text-amber-300",
        rank === 2 && "bg-zinc-300/15 text-zinc-200",
        rank === 3 && "bg-orange-500/20 text-orange-300",
        rank > 3 && "bg-white/[0.04] text-zinc-500",
      )}
    >
      {rank}
    </span>
  );
}
