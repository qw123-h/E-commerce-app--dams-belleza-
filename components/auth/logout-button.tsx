"use client";

import {signOut} from "next-auth/react";

type LogoutButtonProps = {
  label: string;
  locale: string;
};

export function LogoutButton({label, locale}: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({callbackUrl: `/${locale}/auth/sign-in`})}
      className="rounded-full border border-charcoal-900/15 bg-charcoal-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-cream-50 shadow-sm shadow-charcoal-900/15 transition hover:bg-charcoal-800"
    >
      {label}
    </button>
  );
}
