"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./Icon";

/** Remote league artwork can come from Roblox or from an admin-supplied host. */
export function LeagueImage({src, alt = "", size = 34, username, cover = false, className = ""}: {
  src: string; alt?: string; size?: number; username?: string; cover?: boolean; className?: string;
}) {
  const [failedSrc,setFailedSrc] = useState<string | null>(null);
  const [retryFailed,setRetryFailed] = useState(false);
  const failed = failedSrc === src;
  if (failed && (!username || retryFailed)) {
    return <span className={`league-image-fallback ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined} style={cover ? undefined : {width:size,height:size}}><Icon name={username ? 'players' : 'flag'} size={Math.min(size - 4,22)}/></span>;
  }
  const intended = failed && username ? `/api/roblox/avatar-image?username=${encodeURIComponent(username)}` : src;
  return <Image src={intended} alt={alt} unoptimized width={cover ? undefined : size} height={cover ? undefined : size} fill={cover} sizes={cover ? '100vw' : undefined} className={className} onError={() => { if (failed) setRetryFailed(true); else {setRetryFailed(false);setFailedSrc(src);} }}/>
}
