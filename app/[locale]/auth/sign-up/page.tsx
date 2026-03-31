import {getTranslations} from "next-intl/server";
import {SignUpForm} from "@/components/auth/sign-up-form";
import {routing} from "@/i18n/routing";

export default async function SignUpPage({
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
    <section className="mx-auto max-w-md rounded-3xl border border-charcoal-900/10 bg-cream-50 p-8 shadow-xl shadow-charcoal-900/10">
      <h1 className="font-display text-3xl text-charcoal-900">{t("signUpTitle")}</h1>
      <p className="mt-2 text-sm text-charcoal-700">{t("signUpSubtitle")}</p>

      <SignUpForm
        locale={locale}
        callbackUrl={callbackUrl}
        labels={{
          firstName: t("firstName"),
          lastName: t("lastName"),
          email: t("email"),
          password: t("password"),
          confirmPassword: t("confirmPassword"),
          createAccount: t("createAccount"),
          creatingAccount: t("creatingAccount"),
          alreadyHaveAccount: t("alreadyHaveAccount"),
          signInLink: t("signInLink"),
          passwordMismatch: t("passwordMismatch"),
          registerError: t("registerError"),
          emailExists: t("emailExists"),
        }}
      />
    </section>
  );
}