"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

type DesktopHeaderNavProps = {
  links: NavLink[];
};

export function DesktopHeaderNav({links}: DesktopHeaderNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 rounded-full border border-charcoal-900/8 bg-white/60 p-1 text-sm font-semibold text-charcoal-800 shadow-sm shadow-charcoal-900/5 backdrop-blur xl:flex">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-4 py-2.5 transition ${
              isActive
                ? "bg-charcoal-900 text-cream-50 shadow-sm shadow-charcoal-900/20"
                : "text-charcoal-700 hover:bg-white hover:text-charcoal-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}