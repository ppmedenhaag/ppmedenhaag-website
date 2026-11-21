---
title: "Onze website is verhuisd: van Hugo naar Astro, van Netlify naar Cloudflare"
draft: false
date: "2026-11-21T12:00:00+01:00"
description: "Wat we hebben veranderd aan de website van PPME Den Haag, waarom, en wat jij ervan merkt."
image: "images/blog/nieuwe-website.webp"
author: "PPME Den Haag"
categories: ["Blog"]
tags: ["Website"]
type: "post"
---

Assalamu'alaykum warrohmatullohi wabarokatuh

Misschien is het je opgevallen: de website van PPME Den Haag ziet er anders uit. Het meeste gebeurde achter de schermen, dus we leggen graag kort uit wat er is veranderd en waarom.

## Even terugblikken

De vorige website ging in maart 2022 live, gebouwd met Hugo en gehost bij Netlify. Voor die tijd was dat een prima keuze: we konden snel starten, en de website was meteen geschikt voor telefoons. Het heeft ons bijna vijf jaar goed gediend.

Bijna vijf jaar is lang in internetland. Onze wensen zijn gegroeid en de techniek is verder gekomen. Daarom hebben we gekozen voor nieuwe technologie, zodat we beter met onze leden en met het brede publiek kunnen communiceren en onze bijdrage aan de gemeenschap kunnen blijven leveren.

## Wat is er veranderd?

- **De techniek van de website** is vervangen: van Hugo naar Astro. Dit is het "gereedschap" waarmee de pagina's worden gemaakt.
- **De hosting** is verhuisd: van Netlify naar Cloudflare. Dit is de plek waar de website staat en vandaan wordt aangeboden.
- **Het uiterlijk** is opgefrist, zodat het past bij het logo en bij de inschrijf-app voor onze evenementen.

## Wat is hetzelfde gebleven?

Het belangrijkste: **alle adressen van de website blijven werken**. Een link die je ooit hebt opgeslagen of in een appgroep hebt gekregen, brengt je nog steeds op de goede pagina. Ook de korte links van flyers, zoals `/zakat/`, werken gewoon door. De inhoud is hetzelfde en de website blijft in het Nederlands, Indonesisch en Engels.

## Waarom hebben we dit gedaan?

Geen grote reden, eerder een rijtje kleine:

- **De oude opzet was verouderd.** De website draaide op een oude versie van Hugo met een thema vol oude, losse onderdelen. Elke aanpassing kostte meer moeite dan nodig, en op den duur wordt zoiets lastig om bij te houden.
- **Zoekmachines en deelknoppen.** De oude site miste een aantal basiszaken waardoor Google de pagina's minder goed begreep en een gedeelde link in WhatsApp vaak geen mooie voorbeeldkaart toonde.
- **Op de telefoon kon het beter.** De meeste bezoekers komen via hun telefoon. Dan moet de site snel laden en prettig lezen.
- **Alles op één plek.** Met Cloudflare regelen we hosting, caching en beveiligingsinstellingen op één plek. Een wijziging gaat nu automatisch live zodra we hem opslaan.

## Wat merk je ervan?

Een paar dingen die er nieuw zijn:

- **Zoeken.** Druk op `Ctrl + K` (of `/`), of tik op het zoekicoon, en zoek door alle pagina's.
- **Gebedstijden** staan nu op de website zelf, op de homepage en op een jaaroverzicht onder Ibadah. Voorheen was dat een aparte pagina die in de website werd ingebed.
- **Agenda en delen.** Bij een aankomend evenement kun je het met één klik aan je agenda toevoegen en delen via WhatsApp.
- **Doneren.** Bij de Sadaqah-pagina's en op de homepage staat nu een iDEAL-knop, het rekeningnummer met kopieerknop en een QR-code.
- **Mooiere linkvoorbeelden** als je een pagina deelt.
- **Sneller.** Zie de vergelijking hieronder.

## Oud en nieuw naast elkaar

We hebben de homepage op een telefoon laten doormeten met Google PageSpeed Insights: links de oude website, rechts de nieuwe.

<div class="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <figure class="m-0">
    <img src="/images/blog/pagespeed-hugo.webp" alt="PageSpeed-score van de oude website: prestaties 80, toegankelijkheid 85, best practices 88, SEO 100. Grootste inhoud verschijnt na 4,6 seconden." width="1000" height="845" loading="lazy" class="h-auto w-full rounded border border-slate-200" />
    <figcaption class="mt-2 text-center text-sm text-slate-500">Oud (Hugo + Netlify)</figcaption>
  </figure>
  <figure class="m-0">
    <img src="/images/blog/pagespeed-astro.webp" alt="PageSpeed-score van de nieuwe website: vier keer 100. Grootste inhoud verschijnt na 1,5 seconden." width="1000" height="845" loading="lazy" class="h-auto w-full rounded border border-slate-200" />
    <figcaption class="mt-2 text-center text-sm text-slate-500">Nieuw (Astro + Cloudflare)</figcaption>
  </figure>
</div>

Het grootste verschil: de belangrijkste inhoud van de pagina staat nu na ongeveer 1,5 seconde op het scherm, tegen 4,6 seconden eerder. Let wel: dit is één meting op één dag, en zulke scores schommelen. Zie het als richting, niet als belofte.

## Wat is er (nog) niet?

We willen eerlijk zijn: niet alles is één-op-één meegenomen.

- De oude overzichtspagina's voor **tags, categorieën en auteurs** bestaan niet meer. Wie zo'n oude link opent, komt automatisch bij het blog uit.
- Er kunnen kleine foutjes zijn die we nog niet hebben gezien. Een pagina die er raar uitziet, een link die niet werkt, een tekst die niet klopt: het is makkelijk te herstellen als we het weten.

## Zie je iets geks?

Laat het ons weten via het [contactformulier](/contact/). Dat helpt ons echt, want met zoveel pagina's in drie talen zien wij zelf niet alles.

## Wil je meehelpen?

Ben je lid van PPME Den Haag en heb je IT-kennis, of wil je graag meer leren over IT en het bouwen van webapplicaties? Dan kun je ons team helpen. Kom gerust langs op het PPME-kantoor in de moskee, of stuur een e-mail naar [info@ppmedenhaag.nl](mailto:info@ppmedenhaag.nl).

Jazakumullahu khairan, en veel plezier met de nieuwe website!

Met vriendelijke groet,

Het IT-team van PPME Den Haag
