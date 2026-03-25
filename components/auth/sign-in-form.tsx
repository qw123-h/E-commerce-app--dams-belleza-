"use client";

import {FormEvent, useState} from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";

type SignInFormProps = {
  callbackUrl: string;
  labels: {
    email: string;
    password: string;
    submit: string;
    loading: string;
    invalidCredentials: string;
  };
};

export function SignInForm({callbackUrl, labels}: SignInFormProps) {
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
    });

    setIsSubmitting(false);

    if (!response || response.error) {
      setError(labels.invalidCredentials);
      return;
    }

    router.push(response.url ?? callbackUrl);
    router.refresh();
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
    </form>
  );
}
