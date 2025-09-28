export type LangOptions ='nl' | 'id' | 'en';
export const defaultLocale = 'nl' as LangOptions;
export const locales = {
  nl: "nl-NL",
  id: "id-ID",
  en: "en-UK",
};

export const LANG_LIST = [
  {
    name: "Nederland",
    code: "nl" as LangOptions,
    flagUrl: "/flags/nl.svg",
  },
  {
    name: "Indonesia",
    code: "id" as LangOptions,
    flagUrl: "/flags/id.svg",
  },
  {
    name: "English",
    code: "en" as LangOptions,
    flagUrl: "/flags/gb.svg",
  },
];

export const menuData  = {
  nl: [
    { text: "Dakwah", href: "/dakwah/" },
    {
      text: "Ibadah",
      links: [
        {
          text: "Toetreden tot de Islam",
          href: "/ibadah/toetreden-islam/",
        },
        {
          text: "Zakat, Infaq en Sadaqah",
          href: "/ibadah/sadaqah/",
        },
        {
          text: "Geboorte",
          href: "/ibadah/geboorte/",
        },
        {
          text: "Overlijden",
          href: "/ibadah/overlijden/",
        },
        {
          text: "Islamitisch trouwen",
          href: "/ibadah/islamitisch-trouwen/",
        },
        {
          text: "Gebedstijden 2024 (Den Haag)",
          href: "/forms/schedule-sholat-den-haag-2024.pdf",
        },
      ],
    },
    { text: "Evenementen", href: "/event/" },
    { text: "Blog", href: "/blog/" },
    {
      text: "Over ons",
      links: [
        {
          text: "Overzicht",
          href: "/about/",
        },
        {
          text: "Lidmaatschap",
          href: "/about/about-1/",
        },
        {
          text: "Contact",
          href: "/contact/",
        },
      ],
    },
  ],
  id: [
    { text: "Dakwah", href: "/id/dakwah/" },
    {
      text: "Ibadah",
      links: [
        {
          text: "Menjadi Mualaf",
          href: "/id//ibadah/toetreden-islam/",
        },
        {
          text: "Zakat, Infaq dan Sadaqah",
          href: "/id/ibadah/sadaqah/",
        },
        {
          text: "Kelahiran",
          href: "/id//ibadah/geboorte/",
        },
        {
          text: "Kematian",
          href: "/id/ibadah/overlijden/",
        },
        {
          text: "Pernikahan Islami",
          href: "/id/ibadah/islamitisch-trouwen/",
        },
        {
          text: "Jadwal Sholat (Den Haag)",
          href: "/id/forms/schedule-sholat-den-haag-2024.pdf",
        },
      ],
    },
    { text: "Event", href: "/id/event/" },
    { text: "Blog", href: "/id/blog/" },
    {
      text: "Info Lain",
      links: [
        {
          text: "Tentang Kita",
          href: "/id/about/",
        },
        {
          text: "Keanggotaan",
          href: "/about/about-1/",
        },
        {
          text: "Hubungi Kami",
          href: "/id/contact/",
        },
      ],
    },
  ],

  en: [
    { text: "Dakwah", href: "/en/dakwah/" },
    {
      text: "Ibadah",
      links: [
        {
          text: "Joining Islam",
          href: "/en/ibadah/toetreden-islam/",
        },
        {
          text: "Zakat, Infaq and Sadaqah",
          href: "/en/ibadah/sadaqah/",
        },
        {
          text: "Birth",
          href: "/en/ibadah/geboorte/",
        },
        {
          text: "Death",
          href: "/en/ibadah/overlijden/",
        },
        {
          text: "Islamic Marriage",
          href: "/en/ibadah/islamitisch-trouwen/",
        },
        {
          text: "Prayer Times (Den Haag)",
          href: "/en/forms/schedule-sholat-den-haag-2024.pdf",
        },
      ],
    },
    { text: "Events", href: "/en/event/" },
    { text: "Blog", href: "/en/blog/" },
    {
      text: "Over ons",
      links: [
        {
          text: "Overzicht",
          href: "/about/",
        },
        {
          text: "Lidmaatschap",
          href: "/about/about-1/",
        },
        {
          text: "Contact Us",
          href: "/en/contact/",
        },
      ],
    },
  ],
};
