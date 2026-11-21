---
title: "Our website has moved: from Hugo to Astro, from Netlify to Cloudflare"
draft: false
date: "2026-11-21T12:00:00+01:00"
description: "What we changed on the PPME Den Haag website, why we did it, and what you'll notice."
image: "images/blog/nieuwe-website.webp"
author: "PPME Den Haag"
categories: ["Blog"]
tags: ["Website"]
type: "post"
---

Assalamu'alaykum warrohmatullohi wabarokatuh

You may have noticed that the PPME Den Haag website looks a little different. Most of the change happened behind the scenes, so here is a short explanation of what we did and why.

## A quick look back

The previous website went live in March 2022, built with Hugo and hosted on Netlify. For its time that was a good fit: it let us launch quickly, and the site was already responsive on phones. It served us well for almost five years.

Almost five years is a long time online. Our needs have grown and the technology has moved on. So we chose newer technology, to communicate better with our members and the wider public, and to keep making our contribution to the community.

## What changed?

- **The technology of the website** was replaced: from Hugo to Astro. This is the "toolbox" used to build the pages.
- **The hosting** moved: from Netlify to Cloudflare. This is where the website lives and gets served from.
- **The look** was refreshed, so it matches our logo and the registration app we use for events.

## What stayed the same?

The important part: **all the website addresses still work**. A link you saved, or got in a group chat years ago, still takes you to the right page. The short links printed on flyers, like `/zakat/`, keep working too. The content is the same, and the site is still in Dutch, Indonesian and English.

## Why did we do it?

There was no single big reason, more a list of small ones:

- **The old setup was getting dated.** The site ran on an old version of Hugo with a theme full of old, separate parts. Every change took more effort than it should, and over time that gets hard to keep up with.
- **Search engines and sharing.** The old site was missing some basics, so Google understood the pages less well, and a link shared on WhatsApp often didn't show a nice preview card.
- **Phones deserved better.** Most visitors come on their phone, so the site should load fast and be pleasant to read.
- **Everything in one place.** With Cloudflare we handle hosting, caching and security settings in one spot. A change goes live automatically once we save it.

## What will you notice?

A few new things:

- **Search.** Press `Ctrl + K` (or `/`), or tap the search icon, and search across all pages.
- **Prayer times** now live on the website itself, on the homepage and in a full-year overview under Ibadah. Before, it was a separate page embedded in the site.
- **Calendar and sharing.** For upcoming events you can add them to your calendar with one click and share them via WhatsApp.
- **Donating.** The Sadaqah pages and the homepage now have an iDEAL button, the bank account number with a copy button, and a QR code.
- **Nicer link previews** when you share a page.
- **Faster.** See the comparison below.

## Old and new, side by side

We ran the homepage through Google PageSpeed Insights on a phone: the old website on the left, the new one on the right.

<div class="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <figure class="m-0">
    <img src="/images/blog/pagespeed-hugo.webp" alt="PageSpeed scores of the old website: performance 80, accessibility 85, best practices 88, SEO 100. Largest content appears after 4.6 seconds." width="1000" height="845" loading="lazy" class="h-auto w-full rounded border border-slate-200" />
    <figcaption class="mt-2 text-center text-sm text-slate-500">Old (Hugo + Netlify)</figcaption>
  </figure>
  <figure class="m-0">
    <img src="/images/blog/pagespeed-astro.webp" alt="PageSpeed scores of the new website: 100 across the board. Largest content appears after 1.5 seconds." width="1000" height="845" loading="lazy" class="h-auto w-full rounded border border-slate-200" />
    <figcaption class="mt-2 text-center text-sm text-slate-500">New (Astro + Cloudflare)</figcaption>
  </figure>
</div>

The biggest difference: the main content of the page now shows up in about 1.5 seconds, versus 4.6 seconds before. Keep in mind this is one measurement on one day, and scores like these bounce around. Take it as a direction, not a promise.

## What isn't there (yet)?

We'd like to be upfront: not everything was carried over one-to-one.

- The old overview pages for **tags, categories and authors** no longer exist. If you open an old link like that, you'll be sent to the blog automatically.
- There may be small mistakes we haven't spotted yet. A page that looks odd, a link that doesn't work, a text that's wrong: all easy to fix once we know about it.

## Spot something odd?

Let us know through the [contact form](/en/contact/). It really helps, because with this many pages in three languages we can't see everything ourselves.

## Want to help?

If you are a member of PPME Den Haag, have IT skills, or would like to learn more about IT and web application development, feel free to contact our team and contribute. Come by the PPME Den Haag office in the mosque, or send an email to [info@ppmedenhaag.nl](mailto:info@ppmedenhaag.nl).

Jazakumullahu khairan, and enjoy the new website!

Best regards,

The PPME Den Haag IT team
