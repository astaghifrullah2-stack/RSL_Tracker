import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { site } from "@/lib/site";
import "./globals.css";
import "./matchcentre.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.tagline.charAt(0)}${site.tagline.slice(1).toLowerCase()}`, template: `%s · ${site.short} Tracker` },
  description: site.description,
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark"><body id="page-top" className="flex min-h-screen flex-col antialiased">
    <a href="#main-content" className="hub-skip">Skip to content</a><Nav/>
    <main id="main-content" className="league-main">{children}</main><Footer/>
  </body></html>;
}
