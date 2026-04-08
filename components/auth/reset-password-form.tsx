"use client";

import {FormEvent, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";

type ResetPasswordFormProps = {
  locale: string;
  token?: string;
  labels: {
    newPassword: string;
    confirmPassword: string;
    resetPassword: string;
    resetting: string;
    success: string;
    error: string;
    invalidToken: string;
    passwordMismatch: string;
    signInLink: string;
  };
};

export function ResetPasswordForm({locale, token, labels}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError(labels.invalidToken);
      return;
    }

    if (password !== confirmPassword) {
      setError(labels.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    const normalizedPassword = password.trim();

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({token, password: normalizedPassword}),
      });

      if (!response.ok) {
        setError(labels.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(labels.success);
      setIsSubmitting(false);
      setTimeout(() => {
        router.replace(`/${locale}/auth/sign-in`);
        router.refresh();
      }, 1200);
    } catch {
      setError(labels.error);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {!token ? <p className="text-sm text-red-700">{labels.invalidToken}</p> : null}

      <div>
        <label className="mb-2 block text-sm font-semibold text-charcoal-800">{labels.newPassword}</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
          className="w-full rounded-2xl border border-charcoal-900/20 bg-white px-4 py-3 text-charcoal-900 outline-none transition focus:border-rose-gold-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-charcoal-800">{labels.confirmPassword}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
          className="w-full rounded-2xl border border-charcoal-900/20 bg-white px-4 py-3 text-charcoal-900 outline-none transition focus:border-rose-gold-500"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting || !token}
        className="w-full rounded-2xl bg-charcoal-900 px-4 py-3 font-semibold text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? labels.resetting : labels.resetPassword}
      </button>

      <p className="text-center text-sm text-charcoal-700">
        <Link href={`/${locale}/auth/sign-in`} className="font-semibold text-charcoal-900 underline">
          {labels.signInLink}
        </Link>
      </p>
    </form>
  );
}
