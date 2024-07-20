import { ui } from "../data/ui";
import { defaultLocale } from "../data/i18n";

export function useTranslations(locale: string) {
  const lang = locale as keyof typeof ui;

  return function t(key: keyof (typeof ui)[typeof defaultLocale]) {
    return  (ui[lang][key] || ui[defaultLocale][key]) ?? `😱🔥 Missing [${lang}] translation for [${key}]. Please update ui.ts file. 🔥😱`;
  };
}
