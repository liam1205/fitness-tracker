import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
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
