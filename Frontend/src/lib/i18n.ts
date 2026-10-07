import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { de as deDateLocale, enUS, type Locale } from "date-fns/locale";
import en from "@/locales/en.json";
import de from "@/locales/de.json";
import type { Language } from "@/api/model";

export const defaultNS = "translation";

export const resources = {
  en: { translation: en },
  de: { translation: de },
} as const;

export type SupportedLanguage = keyof typeof resources;

export const supportedLanguages = Object.keys(
  resources,
) as SupportedLanguage[];

/** Maps the backend's stored language setting to the i18next language code. */
export const LANGUAGE_TO_LOCALE: Record<Language, SupportedLanguage> = {
  english: "en",
  german: "de",
};

/** The backend language setting matching i18next's active language. */
export function currentLanguageSetting(): Language {
  const entry = Object.entries(LANGUAGE_TO_LOCALE).find(
    ([, locale]) => locale === i18n.resolvedLanguage,
  );
  return (entry?.[0] as Language | undefined) ?? "english";
}

const DATE_FNS_LOCALES: Record<SupportedLanguage, Locale> = {
  en: enUS,
  de: deDateLocale,
};

/** The date-fns locale for i18next's active language, for `format(…, { locale })`. */
export function dateFnsLocale(): Locale {
  return DATE_FNS_LOCALES[i18n.resolvedLanguage as SupportedLanguage] ?? enUS;
}

// Keep <html lang> in step so screen readers and hyphenation use the right language.
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

/**
 * Translations are bundled statically, so init resolves synchronously and the
 * first render already has strings. The detected language is persisted in
 * localStorage; unsupported languages fall back to English.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    interpolation: {
      // React already escapes rendered values.
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
