"use client";

import type { ArcadePlayer, CardTier } from "@/lib/arcade-data";
import { cn } from "@/lib/site";

const TIER_STYLES: Record<
  CardTier,
  {
    shell: string;
    badge: string;
    ovrText: string;
    divider: string;
    statVal: string;
    label: string;
  }
> = {
  ICON: {
    shell:
      "border-amber-300/70 bg-gradient-to-b from-[#3d2f10] via-[#1c1608] to-[#0d0d1c] shadow-[0_12px_34px_rgba(245,198,57,0.28)]",
    badge: "bg-amber-300 text-[#1b1404]",
    ovrText: "text-amber-200",
    divider: "border-amber-300/25",
    statVal: "text-amber-200",
    label: "ICON",
  },
  HERO: {
    shell:
      "border-orange-400/70 bg-gradient-to-b from-[#441d0b] via-[#171d42] to-[#090f24] shadow-[0_12px_34px_rgba(255,117,24,0.26)]",
    badge: "bg-orange-500 text-[#0c1022]",
    ovrText: "text-orange-200",
    divider: "border-orange-400/25",
    statVal: "text-orange-200",
    label: "HERO",
  },
  TOTW: {
    shell:
      "border-yellow-400/55 bg-gradient-to-b from-[#191920] via-[#101322] to-[#070a16] shadow-[0_12px_30px_rgba(234,179,8,0.18)]",
    badge: "bg-yellow-400 text-black",
    ovrText: "text-yellow-300",
    divider: "border-yellow-400/20",
    statVal: "text-yellow-200",
    label: "IN-FORM",
  },
  GOLD: {
    shell:
      "border-amber-500/40 bg-gradient-to-b from-[#2c2414] via-[#151c36] to-[#0a1126]",
    badge: "bg-amber-500/25 text-amber-200 border border-amber-400/40",
    ovrText: "text-amber-100",
    divider: "border-white/10",
    statVal: "text-white",
    label: "RARE GOLD",
  },
  SILVER: {
    shell:
      "border-slate-400/35 bg-gradient-to-b from-[#1e2942] via-[#111b33] to-[#090f22]",
    badge: "bg-slate-400/20 text-slate-200 border border-slate-300/30",
    ovrText: "text-slate-100",
    divider: "border-white/10",
    statVal: "text-slate-200",
    label: "CLASSIC",
  },
};

export function FutCard({
  player,
  size = "md",
  showStats = true,
  selected = false,
  onClick,
  subtitle,
  className,
}: {
  player: ArcadePlayer;
  size?: "sm" | "md" | "lg";
  showStats?: boolean;
  selected?: boolean;
  onClick?: () => void;
  subtitle?: string;
  className?: string;
}) {
  const style = TIER_STYLES[player.tier];
  const Tag = onClick ? "button" : "div";

  if (size === "sm") {
    return (
      <Tag
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn(
          "group relative flex w-[112px] flex-col items-center rounded-2xl border p-2 text-center transition",
          style.shell,
          onClick && "cursor-pointer hover:-translate-y-1 hover:brightness-110",
          selected && "ring-2 ring-orange-400",
          className,
        )}
      >
        <div className="flex w-full items-start justify-between px-0.5">
          <div className="text-left leading-none">
            <span className={cn("block text-lg font-black tabular-nums", style.ovrText)}>
              {player.peakOvr}
            </span>
            <span className="block text-[9px] font-extrabold uppercase text-slate-300">
              {player.detailedPosition}
            </span>
          </div>
          <span className={cn("rounded px-1 py-0.5 text-[8px] font-black uppercase", style.badge)}>
            {player.peakClass}
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={player.avatarUrl}
          alt={player.username}
          className="mt-1 h-12 w-12 rounded-full border border-white/15 bg-black/30 object-cover"
        />
        <p className="mt-1.5 w-full truncate text-[11px] font-black text-white">
          {player.username}
        </p>
        <p className="w-full truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {subtitle ?? player.primaryClub}
        </p>
      </Tag>
    );
  }

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] border text-left transition",
        size === "lg" ? "w-full max-w-[260px] p-4" : "w-full max-w-[215px] p-3.5",
        style.shell,
        onClick && "cursor-pointer hover:-translate-y-1 hover:brightness-110",
        selected && "ring-2 ring-orange-400",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="leading-none">
          <span
            className={cn(
              "block font-black tabular-nums tracking-tight",
              size === "lg" ? "text-3xl" : "text-2xl",
              style.ovrText,
            )}
          >
            {player.peakOvr}
          </span>
          <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
            {player.detailedPosition}
          </span>
          {player.isS1Winner ? (
            <span className="mt-1 inline-block text-[10px] font-black text-amber-300" title="Season 1 Champion">
              ★ S1
            </span>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider", style.badge)}>
            {style.label}
          </span>
          <span className="rounded border border-white/15 bg-black/30 px-1.5 py-0.5 text-[10px] font-black text-white">
            {player.peakClass}
          </span>
        </div>
      </div>

      <div className="relative mx-auto my-2.5 flex items-center justify-center">
        <div className="pointer-events-none absolute -inset-2 rounded-full bg-white/5 blur-md" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={player.avatarUrl}
          alt={player.username}
          className={cn(
            "relative rounded-full border-2 border-white/20 bg-[#0b142d] object-cover shadow-lg",
            size === "lg" ? "h-24 w-24" : "h-20 w-20",
          )}
        />
      </div>

      <div className={cn("border-t pt-2 text-center", style.divider)}>
        <p className={cn("truncate font-black text-white", size === "lg" ? "text-base" : "text-sm")}>
          {player.username}
        </p>
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {subtitle ?? player.primaryClub}
        </p>
      </div>

      {showStats ? (
        <div className={cn("mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-2 text-[11px]", style.divider)}>
          {(
            [
              ["AER", player.attrs.pac],
              ["DRI", player.attrs.dri],
              ["SHO", player.attrs.sho],
              ["DEF", player.attrs.def],
              ["PAS", player.attrs.pas],
              ["INT", player.attrs.phy],
            ] as const
          ).map(([k, val]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="font-bold text-slate-400">{k}</span>
              <span className={cn("font-black tabular-nums", style.statVal)}>{val}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Tag>
  );
}
