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
      className="rounded-full border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 transition hover:bg-cream-100"
    >
      {label}
    </button>
  );
}
