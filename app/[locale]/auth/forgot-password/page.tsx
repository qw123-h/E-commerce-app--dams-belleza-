import {getTranslations} from "next-intl/server";
import {ForgotPasswordForm} from "@/components/auth/forgot-password-form";
import {routing} from "@/i18n/routing";

export default async function ForgotPasswordPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const t = await getTranslations({locale, namespace: "auth"});

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-8 shadow-xl shadow-charcoal-900/10">
      <h1 className="font-display text-3xl text-charcoal-900">{t("forgotPasswordTitle")}</h1>
      <p className="mt-2 text-sm text-charcoal-700">{t("forgotPasswordSubtitle")}</p>

      <ForgotPasswordForm
        locale={locale}
        labels={{
          email: t("email"),
          sendResetLink: t("sendResetLink"),
          sending: t("sending"),
          success: t("forgotSuccess"),
          error: t("forgotError"),
          systemError: t("systemError"),
          devResetLabel: t("devResetLabel"),
          devResetOpen: t("devResetOpen"),
          backToSignIn: t("backToSignIn"),
          signInLink: t("signInLink"),
        }}
      />
    </section>
  );
}
