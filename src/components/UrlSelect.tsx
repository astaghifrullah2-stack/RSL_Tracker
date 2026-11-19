"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Option = { value: string; label: string };

function Inner({
  param,
  options,
  allLabel,
  className,
  clears = [],
}: {
  param: string;
  options: Option[];
  allLabel: string;
  className?: string;
  /** Other params to remove when this one changes. */
  clears?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <select
      className={className ?? "input"}
      value={sp.get(param) ?? ""}
      aria-label={allLabel}
      onChange={(e) => {
        const params = new URLSearchParams(sp.toString());
        if (e.target.value) params.set(param, e.target.value);
        else params.delete(param);
        for (const c of clears) params.delete(c);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function UrlSelect(props: {
  param: string;
  options: Option[];
  allLabel: string;
  className?: string;
  clears?: string[];
}) {
  return (
    <Suspense fallback={<div className={props.className ?? "input"} />}>
      <Inner {...props} />
    </Suspense>
  );
}
