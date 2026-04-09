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
    <div className="inline-flex w-full max-w-full items-center justify-between gap-2 rounded-full border border-rose-gold-300/50 bg-white/80 px-3 py-2 text-[11px] sm:text-xs font-semibold text-charcoal-800 shadow-sm shadow-charcoal-900/5 backdrop-blur">
      <span className="shrink-0 uppercase tracking-[0.12em] text-charcoal-600">{t("language")}</span>
      <div className="inline-flex flex-1 items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => handleLocaleChange("fr")}
        className={`rounded-full px-2.5 py-1.5 transition ${
          locale === "fr" ? "bg-rose-gold-500 text-cream-50" : "hover:bg-rose-gold-100"
        }`}
      >
        {t("french")}
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        className={`rounded-full px-2.5 py-1.5 transition ${
          locale === "en" ? "bg-rose-gold-500 text-cream-50" : "hover:bg-rose-gold-100"
        }`}
      >
        {t("english")}
      </button>
      </div>
    </div>
  );
}
