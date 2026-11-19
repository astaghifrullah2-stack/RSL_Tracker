import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/hub/Icon";
import { site } from "@/lib/site";

export function Footer() {
  return <footer className="league-footer"><div className="league-footer-inner">
    <div className="footer-brand"><Image src="/images/rsl-euros-crest.png" alt="" width={32} height={32}/><div><b>RSL TRACKER</b><small>© {new Date().getFullYear()} {site.name} · {site.tagline.charAt(0)}{site.tagline.slice(1).toLowerCase()}</small></div></div>
    <nav aria-label="Footer navigation"><Link href="/archive">Archive</Link><Link href="/rankings">Rankings</Link><Link href="/play">Games hub</Link><a href="#page-top">Back to top <Icon name="diagonal" size={12}/></a></nav>
  </div></footer>;
}
