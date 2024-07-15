export const defaultLocale = "nl";
export const locales = {
  nl: "nl-NL", 
  id: "id-ID",
  en: "en-UK",
};

export const menuData = new Map(Object.entries( {
  "nl": [
    {text:"Dakwah", href:"/dakwah"},
    {
      text: 'Ibadah',
      links: [
        {
          text: 'Toetreden tot de Islam',
          href: '/ibadah/toetreden-islam',
        },
        {
          text: 'Zakat, Infaq en Sadaqah',
          href: '/ibadah/sadaqah',
        },
        {
          text: 'Geboorte',
          href: '/ibadah/geboorte',
        },
        {
          text: 'Overlijden',
          href: '/ibadah/overlijden',
        },
        {
          text: 'Islamitisch trouwen',
          href: '/ibadah/islamitisch-trouwen',
        },       
        {
          text: 'Gebedstijden 2024 (Den Haag)',
          href: '/forms/schedule-sholat-den-haag-2024.pdf',
        },         
      ],
    },
    {text:"Evenementen", href:"/event"},
    {text:"Blog", href:"#"},
    {
      text: 'Over ons',
      links: [
        {
          text: 'Overzicht',
          href: '/about',
        },
        {
          text: 'Lidmaatschap',
          href: '/about/about-1',
        },
        {
          text: 'Contact',
          href: '/contact',
        },
      ],
    }
  ],
  "id": [
    {text:"Dakwah", href:"/dakwah"},
    {
      text: 'Ibadah',
      links: [
        {
          text: 'Toetreden tot de Islam',
          href: '/ibadah/toetreden-islam',
        },
        {
          text: 'Zakat, Infaq en Sadaqah',
          href: '/ibadah/sadaqah',
        },
        {
          text: 'Geboorte',
          href: '/ibadah/geboorte',
        },
        {
          text: 'Overlijden',
          href: '/ibadah/overlijden',
        },
        {
          text: 'Islamitisch trouwen',
          href: '/ibadah/islamitisch-trouwen',
        },       
        {
          text: 'Gebedstijden 2024 (Den Haag)',
          href: '/forms/schedule-sholat-den-haag-2024.pdf',
        },         
      ],
    },
    {text:"Evenementen", href:"/event"},
    {text:"Blog", href:"/blog"},
    {
      text: 'Over ons',
      links: [
        {
          text: 'Overzicht',
          href: '/about',
        },
        {
          text: 'Lidmaatschap',
          href: '/about/about-1',
        },
        {
          text: 'Contact',
          href: '/contact',
        },
      ],
    }
  ],
   
  "en": [
    {text:"Dakwah", href:"/dakwah"},
    {
      text: 'Ibadah',
      links: [
        {
          text: 'Joining Islam',
          href: '/en/ibadah/toetreden-islam',
        },
        {
          text: 'Zakat, Infaq en Sadaqah',
          href: '/ibadah/sadaqah',
        },
        {
          text: 'Geboorte',
          href: '/ibadah/geboorte',
        },
        {
          text: 'Overlijden',
          href: '/ibadah/overlijden',
        },
        {
          text: 'Islamitisch trouwen',
          href: '/ibadah/islamitisch-trouwen',
        },       
        {
          text: 'Gebedstijden 2024 (Den Haag)',
          href: '/forms/schedule-sholat-den-haag-2024.pdf',
        },         
      ],
    },
    {text:"Evenementen", href:"/event"},
    {text:"Blog", href:"/blog"},
    {
      text: 'Over ons',
      links: [
        {
          text: 'Overzicht',
          href: '/about',
        },
        {
          text: 'Lidmaatschap',
          href: '/about/about-1',
        },
        {
          text: 'Contact',
          href: '/contact',
        },
      ],
    }
  ],
   
}));