"use client";

import {FormEvent, useState} from "react";
import Link from "next/link";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";

type SignUpFormProps = {
  locale: string;
  callbackUrl: string;
  labels: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    createAccount: string;
    creatingAccount: string;
    alreadyHaveAccount: string;
    signInLink: string;
    passwordMismatch: string;
    registerError: string;
    emailExists: string;
  };
};

export function SignUpForm({locale, callbackUrl, labels}: SignUpFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(labels.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          firstName,
          lastName,
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError(labels.emailExists);
        } else {
          setError(labels.registerError);
        }
        setIsSubmitting(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password: normalizedPassword,
        callbackUrl,
        redirect: false,
      }).catch(() => null);

      if (!signInResult || signInResult.error || !signInResult.ok) {
        router.replace(`/${locale}/auth/sign-in`);
        router.refresh();
        setIsSubmitting(false);
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
      setIsSubmitting(false);
    } catch {
      setError(labels.registerError);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-charcoal-800">{labels.firstName}</label>
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            className="w-full rounded-2xl border border-charcoal-900/20 bg-white px-4 py-3 text-charcoal-900 outline-none transition focus:border-rose-gold-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-charcoal-800">{labels.lastName}</label>
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            className="w-full rounded-2xl border border-charcoal-900/20 bg-white px-4 py-3 text-charcoal-900 outline-none transition focus:border-rose-gold-500"
          />
        </div>
      </div>

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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-charcoal-900 px-4 py-3 font-semibold text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? labels.creatingAccount : labels.createAccount}
      </button>

      <p className="text-center text-sm text-charcoal-700">
        {labels.alreadyHaveAccount}{" "}
        <Link href={`/${locale}/auth/sign-in`} className="font-semibold text-charcoal-900 underline">
          {labels.signInLink}
        </Link>
      </p>
    </form>
  );
}