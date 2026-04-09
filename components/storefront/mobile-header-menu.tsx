"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";
import {LanguageSwitcher} from "@/components/storefront/language-switcher";
import {LogoutButton} from "@/components/auth/logout-button";

type MenuLink = {
  href: string;
  label: string;
};

type MobileHeaderMenuProps = {
  menuLabel: string;
  connectHref: string;
  connectLabel: string;
  logoutLabel: string;
  signedIn: boolean;
  links: MenuLink[];
};

export function MobileHeaderMenu({
  menuLabel,
  connectHref,
  connectLabel,
  logoutLabel,
  signedIn,
  links,
}: MobileHeaderMenuProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activeLinkHref = useMemo(() => {
    const match = links.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));
    return match?.href;
  }, [links, pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-header-menu"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-charcoal-900/15 bg-white/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal-900 shadow-md shadow-charcoal-900/8 ring-1 ring-white/70 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg lg:hidden"
      >
        <span className="flex flex-col gap-1">
          <span className="block h-0.5 w-4 rounded-full bg-charcoal-900" />
          <span className="block h-0.5 w-4 rounded-full bg-charcoal-900" />
          <span className="block h-0.5 w-4 rounded-full bg-charcoal-900" />
        </span>
        {menuLabel}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-charcoal-900/35 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[min(92vw,24rem)] p-3 sm:p-4">
            <div
              id="mobile-header-menu"
              className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,249,242,0.98)_0%,rgba(246,236,223,0.97)_100%)] shadow-[0_24px_80px_rgba(31,27,26,0.28)] ring-1 ring-charcoal-900/5"
            >
              <div className="flex items-start justify-between gap-3 border-b border-charcoal-900/8 px-4 py-4 sm:px-5">
                <div>
                  <p className="font-display text-xl text-charcoal-900">Dam's belleza</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-charcoal-600">Yaounde • Mokolo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-charcoal-900/10 bg-white/90 text-charcoal-900 shadow-sm transition hover:bg-white"
                  aria-label="Close menu"
                >
                  <span className="relative block h-4 w-4">
                    <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rotate-45 rounded-full bg-charcoal-900" />
                    <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 -rotate-45 rounded-full bg-charcoal-900" />
                  </span>
                </button>
              </div>

              <nav className="grid gap-2 px-3 py-3 text-sm font-semibold text-charcoal-800">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-2xl px-4 py-3.5 transition ${
                      activeLinkHref === link.href
                        ? "border border-charcoal-900/10 bg-white text-charcoal-900 shadow-sm"
                        : "border border-transparent hover:border-charcoal-900/8 hover:bg-white/70"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-charcoal-900/8 px-4 py-4 space-y-3 bg-white/40 backdrop-blur-sm">
                <div className="rounded-2xl border border-charcoal-900/8 bg-white/75 p-2 shadow-sm">
                  <LanguageSwitcher />
                </div>
                {signedIn ? (
                  <LogoutButton label={logoutLabel} locale={locale} />
                ) : (
                  <Link
                    href={connectHref}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-full border border-charcoal-900/15 bg-charcoal-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-cream-50 transition hover:bg-charcoal-800"
                  >
                    {connectLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}