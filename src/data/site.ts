// Organisation facts shown across the site (footer, contact page, donation box). One place to change them.
// Source: the Hugo site's config/_default/config.toml (email, iban) and owner updates (address 2026-11-21, iDEAL link).

export const CONTACT = {
  email: "info@ppmedenhaag.nl",
  /** Formspree form of the live Hugo site (its submissions reach the board's mailbox). */
  formAction: "https://formspree.io/f/mvolqyea",
  address: {
    name: "Masjid Al Hikmah",
    street: "Medlerstraat 4",
    postalCode: "2531 HA",
    city: "Den Haag",
  },
} as const;

export const DONATION = {
  holder: "Persatuan Pemuda Muslim se-Eropa Den Haag",
  iban: "NL26 INGB 0002 1661 44",
  /** ING payment-request link (iDEAL), also used on the homepage band. */
  idealUrl: "https://www.ing.nl/de-ing/payreq?trxid=pGFVuaic76PdDsKuFNeHD4wkJ5edNwsY",
} as const;

/** Google Maps search/directions link for a place name or address (no API key needed). */
export const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const VENUE_MAPS_URL = mapsUrl(
  `${CONTACT.address.name}, ${CONTACT.address.street}, ${CONTACT.address.postalCode} ${CONTACT.address.city}`,
);
