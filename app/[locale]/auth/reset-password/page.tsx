import {getTranslations} from "next-intl/server";
import {ResetPasswordForm} from "@/components/auth/reset-password-form";
import {routing} from "@/i18n/routing";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params?: {locale: string};
  searchParams?: {token?: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const token = searchParams?.token;
  const t = await getTranslations({locale, namespace: "auth"});

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-8 shadow-xl shadow-charcoal-900/10">
      <h1 className="font-display text-3xl text-charcoal-900">{t("resetPasswordTitle")}</h1>
      <p className="mt-2 text-sm text-charcoal-700">{t("resetPasswordSubtitle")}</p>

      <ResetPasswordForm
        locale={locale}
        token={token}
        labels={{
          newPassword: t("newPassword"),
          confirmPassword: t("confirmPassword"),
          resetPassword: t("resetPasswordAction"),
          resetting: t("resetting"),
          success: t("resetSuccess"),
          error: t("resetError"),
          invalidToken: t("invalidResetToken"),
          passwordMismatch: t("passwordMismatch"),
          signInLink: t("signInLink"),
        }}
      />
    </section>
  );
}
