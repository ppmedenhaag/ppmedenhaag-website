"use client";
import { useEffect, useState } from "react";
import {
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { menuData, type LangOptions, defaultLocale } from "../../data/i18n.ts";
import Search, { type SearchLabels } from "./Search.tsx";

interface LangLink {
  name: string;
  code: LangOptions;
  path: string;
}

interface NavProps {
  locale: LangOptions;
  currentPath: string;
  menu: (typeof menuData)[LangOptions];
  langLinks: LangLink[];
  searchLabels: SearchLabels;
}

type MenuItem = NavProps["menu"][number];

const norm = (p: string) => (p.endsWith("/") ? p : p + "/");

/** A link is active when the current page is that page or lives beneath it. */
function isActive(currentPath: string, href?: string) {
  if (!href || href.endsWith(".pdf")) return false;
  const cur = norm(currentPath);
  const target = norm(href);
  // Home links ("/" or "/id/") only match exactly.
  if (target === "/" || /^\/[a-z]{2}\/$/.test(target)) return cur === target;
  return cur.startsWith(target);
}

function groupActive(currentPath: string, item: MenuItem) {
  return (
    isActive(currentPath, (item as any).href) ||
    ((item as any).links ?? []).some((l: any) => isActive(currentPath, l.href))
  );
}

/**
 * Always-visible language switcher: every available translation is shown as a
 * segmented pill (language code). Only translations that exist are linked.
 */
function LanguageSwitcher({
  links,
  current,
  showNames = false,
  className = "",
}: {
  links: LangLink[];
  current: LangOptions;
  showNames?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-0.5 rounded-full bg-white/80 p-1 ring-1 ring-slate-200 ${className}`}
    >
      {links.map((l) => {
        const active = l.code === current;
        return (
          <a
            key={l.code}
            href={l.path}
            hrefLang={l.code}
            lang={l.code}
            aria-current={active ? "true" : undefined}
            title={l.name}
            className={`flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              showNames ? "flex-1 justify-center py-2 text-sm" : ""
            } ${
              active
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:bg-brand-50 hover:text-brand-dark"
            }`}
          >
            <span>{l.code}</span>
          </a>
        );
      })}
    </div>
  );
}

export default function NavbarExample(params: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { menu: localMenu, currentPath, locale } = params;
  const home = locale === defaultLocale ? "/" : `/${locale}/`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-slate-200/80 bg-white/85 shadow-sm shadow-brand/5"
          : "border-slate-200/60 bg-white/70"
      }`}
    >
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center gap-x-2 px-4 sm:gap-x-4 py-2 sm:px-6 lg:px-8"
      >
        {/* Logo */}
        <a href={home} className={`-m-1.5 shrink-0 rounded-md p-1.5 ${focusRing}`}>
          <span className="sr-only">PPME Den Haag</span>
          <img
            alt=""
            src="/ppme-logo.svg"
            className="h-10 w-20 sm:h-12 sm:w-24 lg:h-14 lg:w-28"
          />
        </a>

        {/* Desktop menu */}
        <PopoverGroup className="ml-6 hidden flex-1 items-center gap-x-1 lg:flex">
          {localMenu?.map((item) => {
            const { text } = item;
            const href = (item as any).href as string | undefined;
            const links = (item as any).links as
              | { text: string; href: string }[]
              | undefined;
            const active = groupActive(currentPath, item);
            const base = `relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${focusRing} ${
              active
                ? "text-brand after:absolute after:inset-x-3 after:-bottom-[9px] after:h-0.5 after:rounded-full after:bg-brand"
                : "text-slate-700 hover:bg-brand-50 hover:text-brand-dark"
            }`;

            return links?.length ? (
              <Popover key={text} className="relative">
                <PopoverButton
                  className={`${base} inline-flex items-center gap-x-1 data-open:bg-brand-50 data-open:text-brand-dark`}
                >
                  {text}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="h-4 w-4 text-slate-500 transition-transform duration-200 in-data-open:rotate-180"
                  />
                </PopoverButton>
                <PopoverPanel
                  transition
                  anchor={{ to: "bottom start", gap: 8 }}
                  className="z-50 w-64 origin-top rounded-lg border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-brand/10 backdrop-blur-md transition duration-150 ease-out data-closed:-translate-y-1 data-closed:scale-95 data-closed:opacity-0"
                >
                  {links.map((l) => {
                    const a = isActive(currentPath, l.href);
                    return (
                      <CloseButton
                        key={l.href}
                        as="a"
                        href={l.href}
                        aria-current={a ? "page" : undefined}
                        className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${focusRing} ${
                          a
                            ? "bg-brand-50 font-semibold text-brand"
                            : "text-slate-700 hover:bg-brand-50 hover:text-brand-dark"
                        }`}
                      >
                        {l.text}
                      </CloseButton>
                    );
                  })}
                </PopoverPanel>
              </Popover>
            ) : (
              <a
                key={text}
                href={href}
                aria-current={active ? "page" : undefined}
                className={base}
              >
                {text}
              </a>
            );
          })}
        </PopoverGroup>

        {/* Search: icon on mobile, field-style button on desktop */}
        <div className="ml-auto flex items-center lg:ml-0">
          <Search locale={locale} labels={params.searchLabels} />
        </div>

        {/* Language switcher: always visible (desktop + mobile) */}
        <LanguageSwitcher links={params.langLinks} current={locale} />

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          className={`-mr-1 inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-brand-50 hover:text-brand lg:hidden ${focusRing}`}
        >
          <Bars3Icon aria-hidden="true" className="h-7 w-7" />
        </button>
      </nav>

      {/* Mobile slide-over */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-brand-darkest/40 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0"
        />
        <DialogPanel
          transition
          className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl transition duration-200 ease-out data-closed:translate-x-full"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-brand-50/60 px-4 py-2">
            <a href={home} className={`-m-1.5 rounded-md p-1.5 ${focusRing}`}>
              <span className="sr-only">PPME Den Haag</span>
              <img alt="" src="/ppme-logo.svg" className="h-10 w-20" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className={`-mr-1 rounded-lg p-2 text-slate-700 hover:bg-brand-100 ${focusRing}`}
            >
              <XMarkIcon aria-hidden="true" className="h-7 w-7" />
            </button>
          </div>

          {/* Language choice, large and prominent */}
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Language
            </p>
            <LanguageSwitcher
              links={params.langLinks}
              current={locale}
              showNames
              className="flex w-full"
            />
          </div>

          <div className="flex-1 space-y-1 px-3 py-4">
            {localMenu?.map((item) => {
              const { text } = item;
              const href = (item as any).href as string | undefined;
              const links = (item as any).links as
                | { text: string; href: string }[]
                | undefined;
              const active = groupActive(currentPath, item);
              const row = `flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-semibold transition-colors ${focusRing} ${
                active
                  ? "bg-brand-50 text-brand"
                  : "text-slate-800 hover:bg-brand-50 hover:text-brand-dark"
              }`;

              return links?.length ? (
                <Disclosure key={text} as="div" defaultOpen={active}>
                  <DisclosureButton className={`group ${row}`}>
                    {text}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="h-5 w-5 flex-none transition-transform duration-200 group-data-open:rotate-180"
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-1 space-y-1 border-l-2 border-slate-200 pl-3 ml-4">
                    {links.map((l) => {
                      const a = isActive(currentPath, l.href);
                      return (
                        <a
                          key={l.href}
                          href={l.href}
                          aria-current={a ? "page" : undefined}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${focusRing} ${
                            a
                              ? "bg-brand-50 font-semibold text-brand"
                              : "text-slate-600 hover:bg-brand-50 hover:text-brand-dark"
                          }`}
                        >
                          {l.text}
                        </a>
                      );
                    })}
                  </DisclosurePanel>
                </Disclosure>
              ) : (
                <a
                  key={text}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={row}
                >
                  {text}
                </a>
              );
            })}
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
