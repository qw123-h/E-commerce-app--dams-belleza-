"use client";

import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  function handleLocaleChange(nextLocale: string) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && (segments[0] === "en" || segments[0] === "fr")) {
      segments[0] = nextLocale;
      router.push(`/${segments.join("/")}`);
      return;
    }

    router.push(`/${nextLocale}${pathname}`);
  }

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-rose-gold-300/60 bg-cream-50 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-charcoal-800">
      <span className="mr-0.5">{t("language")}</span>
      <button
        type="button"
        onClick={() => handleLocaleChange("fr")}
        className={`rounded-full px-2 py-1 transition ${
          locale === "fr" ? "bg-rose-gold-500 text-cream-50" : "hover:bg-rose-gold-100"
        }`}
      >
        {t("french")}
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        className={`rounded-full px-2 py-1 transition ${
          locale === "en" ? "bg-rose-gold-500 text-cream-50" : "hover:bg-rose-gold-100"
        }`}
      >
        {t("english")}
      </button>
    </div>
  );
}
