"use client";

import Link from "next/link";
import {createPortal} from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const activeLinkHref = useMemo(() => {
    const match = links.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));
    return match?.href;
  }, [links, pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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

      {mounted
        ? createPortal(
            isOpen ? (
              <div className="fixed inset-0 z-[2147483647] lg:hidden">
                <button
                  type="button"
                  aria-label="Close menu"
                  className="absolute inset-0 bg-[rgba(31,27,26,0.84)] backdrop-blur-md"
                  onClick={() => setIsOpen(false)}
                />

                <div className="relative flex h-full w-full flex-col px-3 py-3 sm:px-6 sm:py-6">
                  <div
                    id="mobile-header-menu"
                    className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,251,247,0.99)_0%,rgba(247,240,231,0.98)_100%)] shadow-[0_32px_100px_rgba(0,0,0,0.45)] ring-1 ring-charcoal-900/5"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-charcoal-900/8 px-5 py-5 sm:px-6">
                      <div>
                        <p className="font-display text-2xl text-charcoal-900">Dam's belleza</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-charcoal-600">Yaounde • Mokolo</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-charcoal-900/10 bg-white/90 text-charcoal-900 shadow-sm transition hover:bg-white"
                        aria-label="Close menu"
                      >
                        <span className="relative block h-4 w-4">
                          <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rotate-45 rounded-full bg-charcoal-900" />
                          <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 -rotate-45 rounded-full bg-charcoal-900" />
                        </span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                      <div className="mb-4 rounded-2xl border border-charcoal-900/8 bg-white/70 px-4 py-3 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal-600">Navigation</p>
                        <p className="mt-1 text-sm text-charcoal-800">Choose a section</p>
                      </div>

                      <nav className="grid gap-2 text-sm font-semibold text-charcoal-800">
                        {links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`rounded-2xl px-4 py-3.5 transition ${
                              activeLinkHref === link.href
                                ? "border border-charcoal-900/10 bg-white text-charcoal-900 shadow-sm"
                                : "border border-transparent hover:border-charcoal-900/8 hover:bg-white"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    <div className="border-t border-charcoal-900/8 bg-white/75 px-4 py-4 space-y-3 backdrop-blur-sm sm:px-6">
                      <div className="rounded-2xl border border-charcoal-900/8 bg-white/90 px-4 py-3 shadow-sm">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-charcoal-600">Language</p>
                        <div className="rounded-2xl border border-charcoal-900/8 bg-white/80 p-2 shadow-sm">
                          <LanguageSwitcher />
                        </div>
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
            ) : null,
            document.body
          )
        : null}
    </>
  );
}