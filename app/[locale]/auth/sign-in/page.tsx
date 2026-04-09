import {getTranslations} from "next-intl/server";
import {SignInForm} from "@/components/auth/sign-in-form";
import {routing} from "@/i18n/routing";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params?: {locale: string};
  searchParams?: {callbackUrl?: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const query = searchParams ?? {};
  const t = await getTranslations({locale, namespace: "auth"});

  const callbackUrl = query.callbackUrl && query.callbackUrl.startsWith("/")
    ? query.callbackUrl
    : `/${locale}`;

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-8 shadow-xl shadow-charcoal-900/10">
      <h1 className="font-display text-3xl text-charcoal-900">{t("signInTitle")}</h1>
      <p className="mt-2 text-sm text-charcoal-700">{t("signInSubtitle")}</p>

      <SignInForm
        locale={locale}
        callbackUrl={callbackUrl}
        labels={{
          email: t("email"),
          password: t("password"),
          submit: t("submit"),
          loading: t("loading"),
          invalidCredentials: t("invalidCredentials"),
          forgotPassword: t("forgotPassword"),
          noAccount: t("noAccount"),
          createAccountLink: t("createAccountLink"),
        }}
      />
    </section>
  );
}
