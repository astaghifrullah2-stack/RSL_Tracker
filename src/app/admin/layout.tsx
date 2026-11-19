import Link from "next/link";
import type { ReactNode } from "react";
import { AdminSessionBridge, LoginForm, SignOutButton } from "@/components/admin/ui";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/sheets", label: "Playersheets" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/trophies", label: "Trophies" },
  { href: "/admin/content", label: "Images & GFX" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authed = await isAdmin();
  if (!authed) {
    return <LoginForm />;
  }

  return (
    <>
      <AdminSessionBridge />
      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] px-3 py-2">
        <span className="px-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-400">
          Admin
        </span>
        {adminLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            {l.label}
          </Link>
        ))}
        <SignOutButton />
      </div>
      {children}
    </>
  );
}
