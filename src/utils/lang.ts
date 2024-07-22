import { ui } from "../data/ui";
import { defaultLocale, locales, type LangOptions } from "../data/i18n";
import { getLocale } from "astro-i18n-aut";
export function getLang(url: URL | string) {
  return getLocale(url) as keyof typeof locales;
}
export function useTranslations(locale: LangOptions) {
  return function t(key: keyof (typeof ui)[LangOptions]) {
    return (
      (ui[locale][key] || ui[defaultLocale][key]) ??
      `😱🔥 Missing [${locale}] translation for [${key}]. Please update ui.ts file. 🔥😱`
    );
  };
}
