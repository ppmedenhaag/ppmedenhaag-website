// Bestuur (board) 2026: the story page at /bestuur-2026/ (+ /id/, /en/). Texts supplied by the board in Indonesian
// (2026-11-21); nl/en are faithful translations (quotes are labelled as translated on the page). No `astro:*` imports.
import type { LangOptions } from "./i18n";

type L10n = Record<LangOptions, string>;

const DIR = "images/bestuur-2026";
export const BESTUUR_GROUP_IMAGE = `${DIR}/bestuur-02.jpg`;
export const BESTUUR_STAIRS_IMAGE = `${DIR}/bestuur-03.jpg`;

export interface BoardMember {
  slug: string;
  name: string;
  /** public/-relative path (400x400 webp). */
  image: string;
  role: L10n;
  born: string;
  food: L10n;
  hobby: L10n;
  quote: L10n;
}

/** In board order. The page alternates the photo left/right by index. */
export const BOARD: BoardMember[] = [
  {
    slug: "eddy",
    name: "Eddy Cahyono Sandino",
    image: `${DIR}/eddy-01.webp`,
    role: { nl: "Voorzitter", id: "Ketua", en: "Chair" },
    born: "Surabaya",
    food: {
      nl: "Sayur asem met gebakken empal-rundvlees en extra pittige sambal terasi",
      id: "Sayur asem dengan daging empal goreng dan sambal terasi extra pedas",
      en: "Sayur asem with fried empal beef and extra-spicy sambal terasi",
    },
    hobby: { nl: "Voetbal en schilderen", id: "Sepak bola dan melukis", en: "Football and painting" },
    quote: {
      nl: "PPME is een organisatie vol nut: een plek om de onderlinge band te versterken, de islamitische broederschap (ukhuwah Islamiyah) te verdiepen en kennis en goedheid met elkaar te delen.",
      id: "PPME adalah organisasi yang penuh manfaat, menjadi wadah untuk mempererat tali silaturahmi, memperkuat ukhuwah Islamiyah, serta saling berbagi ilmu dan kebaikan.",
      en: "PPME is an organisation full of benefit: a place to strengthen the ties between us, deepen Islamic brotherhood (ukhuwah Islamiyah), and share knowledge and goodness with one another.",
    },
  },
  {
    slug: "hamzah",
    name: "Raymond (Hamzah) Sparreboom",
    image: `${DIR}/hamzah-01.webp`,
    role: { nl: "Vicevoorzitter", id: "Wakil ketua", en: "Vice chair" },
    born: "Rotterdam",
    food: { nl: "Sate kambing (geitensaté)", id: "Sate kambing", en: "Sate kambing (goat satay)" },
    hobby: {
      nl: "Boksen en 'handwerk'",
      id: "Olahraga tinju dan 'kerajinan tangan'",
      en: "Boxing and 'handicrafts'",
    },
    quote: {
      nl: "PPME is mijn thuis en mijn familie. De plek waar ik mijn islamitische leven leid en mijn Indonesische culturele wortels bewaar en liefheb. Een plek om eenheid, liefde en verbondenheid op te bouwen. En in shaa Allah behalen wij allemaal het hoogste paradijs.",
      id: "PPME adalah rumah dan keluarga saya. Tempat saya menjalani kehidupan Islami, menjaga serta mencintai akar budaya Indonesia saya. Tempat membangun persatuan, kasih sayang, dan semangat kebersamaan. Dan insyaallah, kita semua akan meraih surga tertinggi.",
      en: "PPME is my home and my family. The place where I live my Islamic life, and where I protect and love my Indonesian cultural roots. A place to build unity, affection and a spirit of togetherness. And, in shaa Allah, may we all reach the highest paradise.",
    },
  },
  {
    slug: "archi",
    name: "Archi Delphinanto",
    image: `${DIR}/archi-01.webp`,
    role: { nl: "Secretaris", id: "Sekretaris", en: "Secretary" },
    born: "Malang",
    food: { nl: "Bakso, natuurlijk!", id: "Bakso dong!", en: "Bakso, of course!" },
    hobby: { nl: "Lezen en lichte sport", id: "Membaca dan olahraga ringan", en: "Reading and light exercise" },
    quote: {
      nl: "PPME is meer dan een organisatie: het is een thuis van broederschap en een plek waar goedheid groeit. Ik ben dankbaar dat ik deel mag zijn van deze reis. Dank aan de oprichters, de voorgangers en alle collega's. Moge PPME de eenheid blijven bewaren en goedheid blijven verspreiden tot in de generaties na ons. Moge het een voortdurende liefdadigheid (amal jariyah) zijn. In shaa Allah.",
      id: "PPME bukan sekadar organisasi, tetapi rumah persaudaraan dan tempat kebaikan tumbuh. Saya bersyukur menjadi bagian dari perjalanan ini. Terima kasih kepada para pendiri, pendahulu, dan seluruh rekan. Semoga PPME terus menjaga persatuan dan menebarkan kebaikan hingga generasi mendatang. Semoga menjadi amal jariyah yang terus mengalir. InsyaAllah.",
      en: "PPME is not just an organisation, but a home of brotherhood and a place where goodness grows. I am grateful to be part of this journey. Thank you to the founders, those who came before us, and all my colleagues. May PPME keep guarding unity and spreading goodness for generations to come. May it be a continuing charity (amal jariyah) that keeps flowing. In shaa Allah.",
    },
  },
  {
    slug: "marwan",
    name: "Marwan Wirianto",
    image: `${DIR}/marwan-01.webp`,
    role: { nl: "Penningmeester I", id: "Bendahara I", en: "Treasurer I" },
    born: "Jakarta",
    food: {
      nl: "Lekker eten dat GRATIS is!",
      id: "Makanan enak yang GRATIS!",
      en: "Delicious food that's FREE!",
    },
    hobby: { nl: "Geld tellen", id: "Menghitung duit", en: "Counting money" },
    quote: {
      nl: "PPME is onze grote familie in Nederland. Ver van het land waar we geboren zijn, is PPME de plek waar we de warmte van thuis vinden, de broederschap koesteren en elkaar sterken in goede en moeilijke tijden.",
      id: "PPME adalah keluarga besar kami di Belanda. Di tengah jauhnya tanah kelahiran, PPME menjadi tempat kami menemukan kehangatan rumah, merawat persaudaraan, dan saling menguatkan dalam suka maupun duka.",
      en: "PPME is our big family in the Netherlands. Far from the land of our birth, PPME is where we find the warmth of home, nurture brotherhood and strengthen one another in joy and in sorrow.",
    },
  },
  {
    slug: "gusti",
    name: "La Gusti Negeri",
    image: `${DIR}/gusti-01.webp`,
    role: { nl: "Penningmeester II", id: "Bendahara II", en: "Treasurer II" },
    born: "Surabaya",
    food: { nl: "Sate kambing (geitensaté)", id: "Sate kambing", en: "Sate kambing (goat satay)" },
    hobby: { nl: "Voetbal kijken", id: "Nonton sepakbola", en: "Watching football" },
    quote: {
      nl: "Alhamdulillah, dankzij PPME is er een goede plek voor Indonesische moslims in Nederland. Moge Allah tevreden zijn met alles wat er bij PPME Den Haag gebeurt.",
      id: "Alhamdulillah dengan adanya PPME terasa ada wadah yang baik untuk umat muslim Indonesia di Belanda. Semoga Allah ridha atas semuanya di PPME Den Haag ini.",
      en: "Alhamdulillah, with PPME there is a good home for Indonesian Muslims in the Netherlands. May Allah be pleased with everything we do here at PPME Den Haag.",
    },
  },
  {
    slug: "wati",
    name: "Wati Chaeron",
    image: `${DIR}/wati-01.webp`,
    role: { nl: "Penningmeester III", id: "Bendahara III", en: "Treasurer III" },
    born: "Den Haag",
    food: {
      nl: "Patat met mayonaise, sambal goreng tempe, tahu en terong",
      id: "Patat met mayonaise, sambal goreng tempe, tahu dan terong",
      en: "Fries with mayonnaise, sambal goreng tempeh, tofu and aubergine",
    },
    hobby: {
      nl: "Schrijven, lezen en Arabisch leren",
      id: "Menulis, membaca dan belajar Bahasa Arab",
      en: "Writing, reading and learning Arabic",
    },
    quote: {
      nl: "Mijn ouders behoorden tot de eerste generatie PPME-leden. Ik wil deze dakwah samen met mijn vrienden voortzetten, zoals onze ouders deze organisatie destijds opbouwden met Bapak Hambali en wijlen Bapak Naf'an Sulchan. Moge Allah SWT onze stappen altijd zegenen. Aamiin.",
      id: "Orang tua saya merupakan jamaah generasi pertama PPME. Saya ingin meneruskan dakwah ini bersama kawan-kawan, sebagaimana orang tua kami dahulu membangun organisasi ini bersama Bapak Hambali dan alm. Bapak Naf'an Sulchan. Semoga Allah SWT senantiasa memberkahi langkah kita semua. Aamiin.",
      en: "My parents were part of PPME's first generation of members. I want to carry this dakwah forward together with my friends, just as our parents once built this organisation with Bapak Hambali and the late Bapak Naf'an Sulchan. May Allah SWT always bless our steps. Aamiin.",
    },
  },
];

/** Image paths that get build-time srcset variants (see utils/img.ts). Portraits are only 400 px, so they need none. */
export const BESTUUR_RESPONSIVE_IMAGES = [BESTUUR_GROUP_IMAGE, BESTUUR_STAIRS_IMAGE];

export interface BestuurCopy {
  eyebrow: string;
  title: string;
  lead: string;
  intro: string;
  heroAlt: string;
  stairsAlt: string;
  stats: { value: string; label: string }[];
  chapters: { title: string; text: string }[];
  labels: { born: string; food: string; hobby: string; quote: string };
  /** aria labels for the phone photo zoom. */
  zoom: { open: string; close: string };
  /** Shown under the closing band on translated pages only. */
  translationNote?: string;
  interlude: { quote: string; by: string };
  closing: { title: string; text: string; join: string; contact: string };
}

export const BESTUUR_COPY: Record<LangOptions, BestuurCopy> = {
  nl: {
    eyebrow: "PPME Den Haag",
    title: "Bestuur 2026",
    lead: "Zes mensen, één thuis.",
    intro:
      "Achter elke kajian, elke bijeenkomst en elk warm gesprek staan mensen. Dit is het bestuur van PPME Den Haag voor 2026: wie ze zijn, waar ze vandaan komen, wat ze het liefst eten — en wat PPME voor hen betekent.",
    heroAlt: "De zes bestuursleden in batikhemden, voor een muur met Arabische kalligrafie.",
    stairsAlt: "De zes bestuursleden lachend op een trap, in dezelfde batikhemden.",
    stats: [
      { value: "6", label: "bestuursleden" },
      { value: "5", label: "geboorteplaatsen, van Surabaya tot Den Haag" },
      { value: "2×", label: "sate kambing als favoriet" },
    ],
    chapters: [
      { title: "Aan het roer", text: "De voorzitter, de vicevoorzitter en de secretaris." },
      { title: "Het vertrouwen bewaren", text: "De drie penningmeesters." },
    ],
    labels: { born: "Geboren in", food: "Favoriet eten", hobby: "Hobby's", quote: "PPME, in eigen woorden" },
    zoom: { open: "Foto vergroten", close: "Sluiten" },
    translationNote: "De citaten zijn vertaald uit het Indonesisch, de taal waarin het bestuur ze schreef.",
    interlude: {
      quote: "PPME is onze grote familie in Nederland.",
      by: "Marwan Wirianto, penningmeester I",
    },
    closing: {
      title: "Het werk gaat door",
      text: "PPME werd opgebouwd door de eerste generatie. Dit bestuur zet het voort, en jij hoort erbij.",
      join: "Word lid",
      contact: "Neem contact op",
    },
  },
  id: {
    eyebrow: "PPME Den Haag",
    title: "Pengurus 2026",
    lead: "Enam orang, satu rumah.",
    intro:
      "Di balik setiap kajian, setiap pertemuan, dan setiap obrolan hangat ada orang-orang yang menggerakkannya. Inilah pengurus PPME Den Haag 2026: siapa mereka, dari mana mereka berasal, apa makanan favorit mereka — dan apa arti PPME bagi mereka.",
    heroAlt: "Enam pengurus berbaju batik di depan dinding berkaligrafi Arab.",
    stairsAlt: "Enam pengurus tersenyum lebar di tangga, dengan baju batik yang sama.",
    stats: [
      { value: "6", label: "pengurus" },
      { value: "5", label: "kota kelahiran, dari Surabaya sampai Den Haag" },
      { value: "2×", label: "sate kambing sebagai favorit" },
    ],
    chapters: [
      { title: "Di kemudi", text: "Ketua, wakil ketua, dan sekretaris." },
      { title: "Menjaga amanah", text: "Tiga bendahara." },
    ],
    labels: { born: "Tempat lahir", food: "Makanan favorit", hobby: "Hobi", quote: "Pendapat tentang PPME" },
    zoom: { open: "Perbesar foto", close: "Tutup" },
    interlude: {
      quote: "PPME adalah keluarga besar kami di Belanda.",
      by: "Marwan Wirianto, Bendahara I",
    },
    closing: {
      title: "Perjalanan ini berlanjut",
      text: "PPME dibangun oleh generasi pertama. Pengurus ini melanjutkannya, dan kamu bagian dari itu.",
      join: "Jadi anggota",
      contact: "Hubungi kami",
    },
  },
  en: {
    eyebrow: "PPME Den Haag",
    title: "Board 2026",
    lead: "Six people, one home.",
    intro:
      "Behind every kajian, every gathering and every warm conversation there are people. This is the 2026 board of PPME Den Haag: who they are, where they come from, what they like to eat — and what PPME means to them.",
    heroAlt: "The six board members in batik shirts, in front of a wall with Arabic calligraphy.",
    stairsAlt: "The six board members smiling on a staircase, in the same batik shirts.",
    stats: [
      { value: "6", label: "board members" },
      { value: "5", label: "birthplaces, from Surabaya to The Hague" },
      { value: "2×", label: "sate kambing as favourite" },
    ],
    chapters: [
      { title: "At the helm", text: "The chair, the vice chair and the secretary." },
      { title: "Keeping the trust", text: "The three treasurers." },
    ],
    labels: { born: "Born in", food: "Favourite food", hobby: "Hobbies", quote: "On PPME, in their words" },
    zoom: { open: "Enlarge photo", close: "Close" },
    translationNote: "The quotes are translated from Indonesian, the language the board wrote them in.",
    interlude: {
      quote: "PPME is our big family in the Netherlands.",
      by: "Marwan Wirianto, Treasurer I",
    },
    closing: {
      title: "The work continues",
      text: "PPME was built by the first generation. This board carries it on, and you are part of it.",
      join: "Become a member",
      contact: "Get in touch",
    },
  },
};
