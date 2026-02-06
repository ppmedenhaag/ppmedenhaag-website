import { ui } from "../data/ui";
import { defaultLocale, locales, type LangOptions } from "../data/i18n";
// import { getLocale } from "astro-i18n-aut"; 
// Deprecated: helper that parsed URL. In Astro 5 use Astro.currentLocale
// For now, implementing simple path extraction for legacy compatibility if needed outside .astro files
export function getLang(url: URL | string) {
  const path = typeof url === "string" ? new URL(url).pathname : url.pathname;
  const firstSegment = path.split('/')[1];
  if (Object.keys(locales).includes(firstSegment)) {
    return firstSegment as keyof typeof locales;
  }
  return defaultLocale;
}
export function useTranslations(locale: LangOptions) {
  return function t(key: keyof (typeof ui)[LangOptions]) {
    return (
      (ui[locale][key] || ui[defaultLocale][key]) ??
      `😱🔥 Missing [${locale}] translation for [${key}]. Please update ui.ts file. 🔥😱`
    );
  };
}
