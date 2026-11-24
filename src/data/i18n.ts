export type LangOptions ='nl' | 'id' | 'en';
export const defaultLocale = 'nl' as LangOptions;
export const locales = {
  nl: "nl-NL",
  id: "id-ID",
  en: "en-UK",
};

export const LANG_LIST = [
  {
    name: "Nederlands",
    code: "nl" as LangOptions,
  },
  {
    name: "Bahasa Indonesia",
    code: "id" as LangOptions,
  },
  {
    name: "English",
    code: "en" as LangOptions,
  },
];

type MenuLabels = {
  tpa: string;
  pengajian: string;
  pengajianOverview: string;
  services: string;
  mualaf: string;
  nikah: string;
  birth: string;
  death: string;
  zis: string;
  membership: string;
  events: string;
  more: string;
  blog: string;
  prayerTimes: string;
  about: string;
  board: string;
  contact: string;
};

/**
 * Menu grouping (visual only). Every href is an existing legacy URL; the
 * grouping never changes where a page lives (SEO parity with the Hugo site).
 * Items without content yet (An Nisa, Aqiqah, Buletin) are deliberately not
 * listed - add them here once their pages exist.
 * `exact` = the link is only active on that exact page, not on pages beneath it.
 */
const buildMenu = (prefix: string, t: MenuLabels) => [
  {
    text: t.pengajian,
    links: [
      { text: t.pengajianOverview, href: `${prefix}/dakwah/`, exact: true },
      { text: t.tpa, href: `${prefix}/dakwah/dakwah-1/` },
      { text: "Al Ittihaad", href: `${prefix}/dakwah/dakwah-3/` },
      { text: "Al Moeminoen", href: `${prefix}/dakwah/dakwah-2/` },
    ],
  },
  {
    text: t.services,
    links: [
      { text: t.mualaf, href: `${prefix}/ibadah/toetreden-islam/` },
      { text: t.nikah, href: `${prefix}/ibadah/islamitisch-trouwen/` },
      { text: t.birth, href: `${prefix}/ibadah/geboorte/` },
      { text: t.death, href: `${prefix}/ibadah/overlijden/` },
      { text: t.zis, href: `${prefix}/ibadah/sadaqah/` },
    ],
  },
  { text: t.membership, href: `${prefix}/about/about-1/` },
  { text: t.events, href: `${prefix}/event/` },
  {
    text: t.more,
    links: [
      { text: t.blog, href: `${prefix}/blog/` },
      { text: t.prayerTimes, href: `${prefix}/ibadah/gebedstijden/` },
      { text: t.about, href: `${prefix}/about/`, exact: true },
      { text: t.board, href: `${prefix}/bestuur-2026/` },
      { text: t.contact, href: `${prefix}/contact/` },
    ],
  },
];

export const menuData = {
  nl: buildMenu("", {
    tpa: "Kinderlessen (TPA)",
    pengajian: "Pengajian",
    pengajianOverview: "Overzicht",
    services: "Diensten",
    mualaf: "Toetreden tot de Islam",
    nikah: "Islamitisch trouwen",
    birth: "Geboorte",
    death: "Overlijden",
    zis: "Zakat, Infaq en Sadaqah",
    membership: "Lidmaatschap",
    events: "Evenementen",
    more: "Meer",
    blog: "Blog",
    prayerTimes: "Gebedstijden (Den Haag)",
    about: "Over ons",
    board: "Bestuur 2026",
    contact: "Contact",
  }),
  id: buildMenu("/id", {
    tpa: "TPA",
    pengajian: "Pengajian",
    pengajianOverview: "Ringkasan",
    services: "Layanan",
    mualaf: "Menjadi Mualaf",
    nikah: "Pernikahan Islami",
    birth: "Kelahiran",
    death: "Kematian",
    zis: "Zakat, Infaq dan Sadaqah",
    membership: "Keanggotaan",
    events: "Acara",
    more: "Lainnya",
    blog: "Blog",
    prayerTimes: "Jadwal Sholat (Den Haag)",
    about: "Tentang Kita",
    board: "Pengurus 2026",
    contact: "Hubungi Kami",
  }),
  en: buildMenu("/en", {
    tpa: "Children's school (TPA)",
    pengajian: "Learning",
    pengajianOverview: "Overview",
    services: "Services",
    mualaf: "Joining Islam",
    nikah: "Islamic Marriage",
    birth: "Birth",
    death: "Death",
    zis: "Zakat, Infaq and Sadaqah",
    membership: "Membership",
    events: "Events",
    more: "More",
    blog: "Blog",
    prayerTimes: "Prayer Times (Den Haag)",
    about: "About us",
    board: "Board 2026",
    contact: "Contact Us",
  }),
};
