"use client";

import {FormEvent, useState} from "react";
import Link from "next/link";

type ForgotPasswordFormProps = {
  locale: string;
  labels: {
    email: string;
    sendResetLink: string;
    sending: string;
    success: string;
    error: string;
    systemError: string;
    devResetLabel: string;
    devResetOpen: string;
    backToSignIn: string;
    signInLink: string;
  };
};

export function ForgotPasswordForm({locale, labels}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setDevResetUrl(null);
    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-locale": locale,
        },
        body: JSON.stringify({email: normalizedEmail}),
      });

      if (!response.ok) {
        if (response.status === 503) {
          setError(labels.systemError);
        } else {
          setError(labels.error);
        }
        setIsSubmitting(false);
        return;
      }

      const payload = await response.json().catch(() => null);
      const maybeResetUrl = typeof payload?.resetUrl === "string" ? payload.resetUrl : null;

      setSuccess(labels.success);
      if (maybeResetUrl) {
        setDevResetUrl(maybeResetUrl);
      }
      setIsSubmitting(false);
    } catch {
      setSuccess(labels.success);
      setError(null);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-charcoal-800">{labels.email}</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-2xl border border-charcoal-900/20 bg-white px-4 py-3 text-charcoal-900 outline-none transition focus:border-rose-gold-500"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
      {devResetUrl ? (
        <div className="rounded-2xl border border-dashed border-charcoal-900/20 bg-white p-3 text-sm">
          <p className="font-semibold text-charcoal-900">{labels.devResetLabel}</p>
          <a href={devResetUrl} className="mt-1 inline-block break-all text-charcoal-900 underline">
            {labels.devResetOpen}
          </a>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-charcoal-900 px-4 py-3 font-semibold text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? labels.sending : labels.sendResetLink}
      </button>

      <p className="text-center text-sm text-charcoal-700">
        {labels.backToSignIn}{" "}
        <Link href={`/${locale}/auth/sign-in`} className="font-semibold text-charcoal-900 underline">
          {labels.signInLink}
        </Link>
      </p>
    </form>
  );
}
