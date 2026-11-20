// SEO constants and hand-written copy for code-driven pages. No `astro:*` imports here:
// astro.config.mjs imports this file too. Plan: docs/seo/SEO-PLAN.md.
import type { LangOptions } from "./i18n";

/**
 * Origin used for every absolute URL (canonical, og:*, hreflang, JSON-LD, sitemap, RSS).
 * Until the cutover this is the staging host; the cutover sets PUBLIC_SITE_URL=https://www.ppmedenhaag.nl
 * (GitHub repo variable). See docs/seo/PROGRESS.md.
 */
export const STAGING_ORIGIN = "https://website-v2.ppmedenhaag.nl";
export const PRODUCTION_ORIGIN = "https://www.ppmedenhaag.nl";
export const DEFAULT_SITE_URL = STAGING_ORIGIN;

export const SITE_NAME = "PPME Den Haag";

export const OG_LOCALE: Record<LangOptions, string> = {
  nl: "nl_NL",
  id: "id_ID",
  en: "en_GB",
};

export const SOCIAL_LINKS = [
  "https://www.facebook.com/PPMEcabDenHaag/",
  "https://www.instagram.com/ppme_denhaag/",
  "https://www.youtube.com/@ppmedenhaag5842",
];

/** Card/OG image size. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * Venue facts for structured data. Address confirmed by the owner (2026-11-21): Medlerstraat 4, 2531 HA Den Haag
 * (same as components/footer.astro). An address written in an event's `location` text wins over this default.
 */
export const VENUES: { match: RegExp; name: string; address?: { street?: string; postalCode?: string; city?: string } }[] = [
  {
    match: /al\s*hikmah/i,
    name: "Masjid Al Hikmah",
    address: { street: "Medlerstraat 4", postalCode: "2531 HA", city: "Den Haag" },
  },
];

export type StaticKey = "home" | "events" | "blog" | "contact" | "prayer" | "ibadah";

export interface StaticCopy {
  title: string;
  description: string;
  /** Second line on the generated share card. */
  subtitle: string;
}

/** Route (without locale prefix, no slashes) of each code-driven page. "" = homepage. */
export const STATIC_ROUTES: Record<StaticKey, string> = {
  home: "",
  events: "event",
  blog: "blog",
  contact: "contact",
  prayer: "ibadah/gebedstijden",
  ibadah: "ibadah",
};

export const STATIC_COPY: Record<Exclude<StaticKey, "prayer">, Record<LangOptions, StaticCopy>> = {
  home: {
    nl: {
      title: "PPME Den Haag | Islamitische gemeenschap in Den Haag",
      description:
        "PPME Den Haag is de Indonesische islamitische gemeenschap in Den Haag: gebedstijden, lezingen en activiteiten in Masjid Al Hikmah, informatie over de islam en onze agenda.",
      subtitle: "Masjid Al Hikmah · Den Haag",
    },
    id: {
      title: "PPME Den Haag | Komunitas Muslim Indonesia di Den Haag",
      description:
        "PPME Den Haag adalah komunitas muslim Indonesia di Den Haag: jadwal sholat, kajian dan kegiatan di Masjid Al Hikmah, informasi tentang Islam, serta agenda kami.",
      subtitle: "Masjid Al Hikmah · Den Haag",
    },
    en: {
      title: "PPME Den Haag | Indonesian Muslim community in The Hague",
      description:
        "PPME Den Haag is the Indonesian Muslim community in The Hague: prayer times, lectures and activities at Masjid Al Hikmah, information about Islam and our agenda.",
      subtitle: "Masjid Al Hikmah · The Hague",
    },
  },
  events: {
    nl: {
      title: "Evenementen",
      description:
        "Alle evenementen van PPME Den Haag: kajian, lezingen, workshops en feesten in Masjid Al Hikmah en online. Bekijk de agenda en eerdere activiteiten.",
      subtitle: "Agenda en eerdere activiteiten",
    },
    id: {
      title: "Event & Kegiatan",
      description:
        "Semua event PPME Den Haag: kajian, ceramah, workshop dan perayaan di Masjid Al Hikmah maupun online. Lihat agenda dan kegiatan sebelumnya.",
      subtitle: "Agenda dan kegiatan sebelumnya",
    },
    en: {
      title: "Events",
      description:
        "All events of PPME Den Haag: lectures, workshops and celebrations at Masjid Al Hikmah and online. See the agenda and past activities.",
      subtitle: "Agenda and past activities",
    },
  },
  blog: {
    nl: {
      title: "Nieuws",
      description:
        "Nieuws en mededelingen van PPME Den Haag: programma's, verslagen en aankondigingen voor de moslimgemeenschap in Den Haag.",
      subtitle: "Nieuws en mededelingen",
    },
    id: {
      title: "Berita",
      description:
        "Berita dan pengumuman PPME Den Haag: program, laporan kegiatan dan informasi untuk komunitas muslim di Den Haag.",
      subtitle: "Berita dan pengumuman",
    },
    en: {
      title: "News",
      description:
        "News and announcements from PPME Den Haag: programmes, reports and notices for the Muslim community in The Hague.",
      subtitle: "News and announcements",
    },
  },
  contact: {
    nl: {
      title: "Contact",
      description:
        "Neem contact op met PPME Den Haag voor vragen over lidmaatschap, toetreden tot de islam, islamitisch trouwen, geboorte, overlijden of zakat.",
      subtitle: "Neem contact met ons op",
    },
    id: {
      title: "Kontak",
      description:
        "Hubungi PPME Den Haag untuk pertanyaan seputar keanggotaan, mualaf, pernikahan Islami, kelahiran, kematian atau zakat.",
      subtitle: "Hubungi kami",
    },
    en: {
      title: "Contact",
      description:
        "Contact PPME Den Haag with questions about membership, joining Islam, Islamic marriage, birth, passing away or zakat.",
      subtitle: "Get in touch with us",
    },
  },
  ibadah: {
    nl: {
      title: "Ibadah",
      description:
        "Praktische informatie over ibadah in Den Haag: toetreden tot de islam, islamitisch trouwen, geboorte, overlijden, zakat en gebedstijden.",
      subtitle: "Toetreden, trouwen, geboorte, overlijden en gebedstijden",
    },
    id: {
      title: "Ibadah",
      description:
        "Informasi praktis seputar ibadah di Den Haag: menjadi mualaf, pernikahan Islami, kelahiran, kematian, zakat dan jadwal sholat.",
      subtitle: "Mualaf, pernikahan, kelahiran, kematian dan jadwal sholat",
    },
    en: {
      title: "Ibadah",
      description:
        "Practical information about worship and life events in The Hague: joining Islam, Islamic marriage, birth, passing away, zakat and prayer times.",
      subtitle: "Joining Islam, marriage, birth, passing away and prayer times",
    },
  },
};

/** Description + subtitle of the prayer-times page (title comes from data/prayer strings: it contains the year). */
export const PRAYER_COPY: Record<LangOptions, { description: string; subtitle: string }> = {
  nl: {
    description:
      "Gebedstijden voor Den Haag het hele jaar: Fajr, Zonsopkomst, Dhuhr, Asr, Maghrib en Isha per dag, met zomer- en wintertijd.",
    subtitle: "Fajr, Dhuhr, Asr, Maghrib en Isha per dag",
  },
  id: {
    description:
      "Jadwal sholat Den Haag sepanjang tahun: Subuh, Terbit, Dzuhur, Ashar, Maghrib dan Isya setiap hari, termasuk waktu musim panas dan dingin.",
    subtitle: "Subuh, Dzuhur, Ashar, Maghrib dan Isya setiap hari",
  },
  en: {
    description:
      "Prayer times for The Hague all year: Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha for every day, including summer and winter time.",
    subtitle: "Fajr, Dhuhr, Asr, Maghrib and Isha every day",
  },
};

/** Card eyebrow (small uppercase label above the title) per collection kind. */
export const EYEBROW: Record<string, Record<LangOptions, string>> = {
  event: { nl: "Evenement", id: "Event", en: "Event" },
  blog: { nl: "Nieuws", id: "Berita", en: "News" },
  ibadah: { nl: "Ibadah", id: "Ibadah", en: "Ibadah" },
  about: { nl: "Over ons", id: "Tentang kita", en: "About us" },
  dakwah: { nl: "Dakwah", id: "Dakwah", en: "Dakwah" },
  site: { nl: "PPME Den Haag", id: "PPME Den Haag", en: "PPME Den Haag" },
};

/** Fallback description if a page has neither front matter nor body text. */
export const FALLBACK_DESCRIPTION = STATIC_COPY.home;
