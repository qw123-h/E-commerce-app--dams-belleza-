"use client";

import {FormEvent, useState} from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";
import Link from "next/link";

type SignInFormProps = {
  locale: string;
  callbackUrl: string;
  labels: {
    email: string;
    password: string;
    submit: string;
    loading: string;
    invalidCredentials: string;
    forgotPassword: string;
    noAccount: string;
    createAccountLink: string;
  };
};

export function SignInForm({locale, callbackUrl, labels}: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    }).catch(() => null);

    if (!response || response.error || !response.ok) {
      setIsSubmitting(false);
      setError(labels.invalidCredentials);
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
    setIsSubmitting(false);
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

      <div>
        <label className="mb-2 block text-sm font-semibold text-charcoal-800">{labels.password}</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="w-full rounded-2xl border border-charcoal-900/20 bg-white px-4 py-3 text-charcoal-900 outline-none transition focus:border-rose-gold-500"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-charcoal-900 px-4 py-3 font-semibold text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? labels.loading : labels.submit}
      </button>

      <p className="text-right text-sm">
        <Link href={`/${locale}/auth/forgot-password`} className="font-semibold text-charcoal-900 underline">
          {labels.forgotPassword}
        </Link>
      </p>

      <p className="text-center text-sm text-charcoal-700">
        {labels.noAccount}{" "}
        <Link href={`/${locale}/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-charcoal-900 underline">
          {labels.createAccountLink}
        </Link>
      </p>
    </form>
  );
}
