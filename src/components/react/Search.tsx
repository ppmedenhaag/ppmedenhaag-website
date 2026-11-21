"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import type { LangOptions } from "../../data/i18n.ts";

/**
 * Site search powered by Pagefind. The index is generated at build time
 * (`pagefind --site dist`) and lazy-loaded here on first open — no SaaS, no server.
 * Mobile first: full-screen sheet on phones, centred command-palette modal from `sm`.
 */

export type SearchLabels = Record<string, string>;

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: { title?: string; date?: string };
  filters: Record<string, string[]>;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}
interface PagefindResponse {
  results: PagefindResult[];
  filters: Record<string, Record<string, number>>;
}
interface PagefindApi {
  options: (o: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  filters: () => Promise<unknown>;
  mergeIndex: (path: string, o: Record<string, unknown>) => Promise<void>;
  debouncedSearch: (
    q: string,
    o: Record<string, unknown>,
    ms: number,
  ) => Promise<PagefindResponse | null>;
}

interface Hit {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  section: string;
  lang: string;
  date?: string;
}

const PAGE = 8;
const LANGS: LangOptions[] = ["nl", "id", "en"];

let pagefindPromise: Promise<PagefindApi> | null = null;
const mergedLangs = new Set<string>();

function loadPagefind(): Promise<PagefindApi> {
  if (!pagefindPromise) {
    // Variable path + vite-ignore: the file only exists in the built site (dist/pagefind).
    const path = "/pagefind/pagefind.js";
    pagefindPromise = import(/* @vite-ignore */ path)
      .then(async (m: PagefindApi) => {
        await m.options({ excerptLength: 22 });
        await m.init();
        // Load all filter definitions up front so every search reports section counts.
        await m.filters();
        return m;
      })
      .catch((e) => {
        pagefindPromise = null;
        throw e;
      });
  }
  return pagefindPromise;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function Search({
  locale,
  labels,
}: {
  locale: LangOptions;
  labels: SearchLabels;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allLangs, setAllLangs] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "relevance">("date");
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [facets, setFacets] = useState<Record<string, number>>({});
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const runId = useRef(0);

  const t = (k: string) => labels[k] ?? k;
  const sectionLabel = (s: string) => labels[`search.section.${s}`] ?? s;
  const langName = useMemo(
    () => ({ nl: "NL", id: "ID", en: "EN" }) as Record<string, string>,
    [],
  );

  // Global shortcuts: Ctrl/Cmd+K anywhere, "/" when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    // Page content can open the dialog too (404 page): window.dispatchEvent(new Event("ppme:search")).
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ppme:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ppme:search", onOpen);
    };
  }, []);

  // Warm the index as soon as the dialog opens.
  useEffect(() => {
    if (!open) return;
    loadPagefind().catch(() => setState("error"));
  }, [open]);

  const runSearch = useCallback(
    async (q: string, sec: string | null, all: boolean, by: "date" | "relevance") => {
      const id = ++runId.current;
      const term = q.trim();
      if (!term) {
        setResults([]);
        setHits([]);
        setFacets({});
        setState("idle");
        return;
      }
      setState("loading");
      try {
        const pf = await loadPagefind();
        if (all) {
          const missing = LANGS.filter(
            (l) => l !== locale && !mergedLangs.has(l),
          );
          if (missing.length) {
            try {
              // Pagefind keeps one index per <html lang>. mergeIndex() skips a path that is a
              // prefix of the primary basePath ("/pagefind/"), so "/pagefind/./" (same files,
              // normalised by fetch) is used to pull in the other languages.
              await Promise.all(
                missing.map((l) =>
                  pf.mergeIndex("/pagefind/./", { language: l }),
                ),
              );
              missing.forEach((l) => mergedLangs.add(l));
              await pf.filters();
            } catch {
              // Fall back silently to searching the current language only.
            }
          }
        }
        const base: Record<string, string> = all ? {} : { lang: locale };
        // Newest first (event date / publish date); undated pages sort last. Relevance = Pagefind default.
        const sort = by === "date" ? { sort: { date: "desc" } } : {};
        // The facet counts come from the search without the section filter, so the chips stay stable.
        const wide = await pf.debouncedSearch(term, { filters: base, ...sort }, 160);
        if (wide === null || id !== runId.current) return;
        setFacets(wide.filters?.section ?? {});
        let res = wide.results;
        if (sec) {
          const narrow = await pf.debouncedSearch(
            term,
            { filters: { ...base, section: sec }, ...sort },
            0,
          );
          if (narrow === null || id !== runId.current) return;
          res = narrow.results;
        }
        setResults(res);
        const first = await Promise.all(res.slice(0, PAGE).map((r) => r.data()));
        if (id !== runId.current) return;
        setHits(first.map(toHit(res.slice(0, PAGE))));
        setActive(0);
        setState("ready");
      } catch {
        if (id === runId.current) setState("error");
      }
    },
    [locale],
  );

  useEffect(() => {
    if (open) void runSearch(query, section, allLangs, sortBy);
  }, [query, section, allLangs, sortBy, open, runSearch]);

  const loadMore = async () => {
    const next = results.slice(hits.length, hits.length + PAGE);
    const data = await Promise.all(next.map((r) => r.data()));
    setHits((h) => [...h, ...data.map(toHit(next))]);
  };

  // Keep the keyboard-active row in view.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const close = () => setOpen(false);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      window.location.href = hits[active].url;
    }
  };

  const sections = Object.entries(facets)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const showChips = query.trim() && sections.length > 1;
  const reset = () => {
    setQuery("");
    setSection(null);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Mobile: icon button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search.open")}
        className={`inline-flex size-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand lg:hidden ${focusRing}`}
      >
        <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
      </button>

      {/* Desktop: search field look-alike */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search.open")}
        className={`group hidden h-10 w-56 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 text-sm text-slate-500 transition-all hover:border-brand-300 hover:bg-white hover:text-slate-700 hover:shadow-sm xl:w-64 lg:inline-flex ${focusRing}`}
      >
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="size-4 text-slate-500 transition-colors group-hover:text-brand"
        />
        <span className="flex-1 truncate text-left">{t("search.open")}…</span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-slate-500">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onClose={close} className="relative z-60">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-brand-darkest/50 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex sm:items-start sm:justify-center sm:p-6 sm:pt-[9vh]">
          <DialogPanel
            transition
            className="flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl transition duration-200 ease-out data-closed:translate-y-2 data-closed:opacity-0 sm:h-auto sm:max-h-[min(40rem,80vh)] sm:max-w-2xl sm:rounded-xl sm:border sm:border-slate-200 sm:data-closed:scale-[0.98]"
          >
            {/* Input row */}
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 sm:px-4">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
              />
              <input
                ref={inputRef}
                autoFocus
                type="search"
                role="combobox"
                aria-expanded={hits.length > 0}
                aria-controls="site-search-results"
                aria-activedescendant={
                  hits.length ? `site-search-hit-${active}` : undefined
                }
                aria-label={t("search.open")}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder={t("search.placeholder")}
                className="h-14 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label={t("search.clear")}
                  className={`inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
                >
                  <XMarkIcon aria-hidden="true" className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label={t("search.close")}
                className={`inline-flex h-8 items-center justify-center rounded-lg px-2 text-sm font-semibold text-brand hover:bg-brand-50 sm:border sm:border-slate-200 sm:text-[11px] sm:text-slate-500 sm:hover:text-slate-700 ${focusRing}`}
              >
                <span className="sm:hidden">{t("search.close")}</span>
                <span className="hidden sm:inline">ESC</span>
              </button>
            </div>

            {/* Section chips */}
            {showChips && (
              <div
                role="group"
                aria-label="Filter"
                className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 px-3 py-2.5 sm:px-4 scrollbar-none"
              >
                <Chip active={section === null} onClick={() => setSection(null)}>
                  {t("search.all")}
                </Chip>
                {sections.map(([s, n]) => (
                  <Chip
                    key={s}
                    active={section === s}
                    onClick={() => setSection(s)}
                  >
                    {sectionLabel(s)}
                    <span className="ml-1.5 tabular-nums opacity-90">{n}</span>
                  </Chip>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {state === "error" ? (
                <Message>
                  <p className="font-semibold text-slate-700">
                    {t("search.error")}
                  </p>
                  {import.meta.env.DEV && (
                    <p className="mt-1 text-sm">{t("search.devNote")}</p>
                  )}
                </Message>
              ) : !query.trim() ? (
                <Message>
                  <p className="text-sm">{t("search.hint")}</p>
                </Message>
              ) : state === "loading" && !hits.length ? (
                <ul className="space-y-3 p-4" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="animate-pulse space-y-2">
                      <div className="h-4 w-2/5 rounded bg-slate-100" />
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-4/5 rounded bg-slate-100" />
                    </li>
                  ))}
                </ul>
              ) : state === "ready" && !hits.length ? (
                <Message>
                  <p className="font-semibold text-slate-700">
                    {t("search.noResults")} “{query.trim()}”
                  </p>
                  <p className="mt-1 text-sm">{t("search.noResultsHint")}</p>
                </Message>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                      aria-live="polite"
                    >
                      {results.length} {t("search.results")}
                    </p>
                    <div
                      role="group"
                      aria-label={t("search.sortLabel")}
                      className="inline-flex shrink-0 rounded-full bg-slate-100 p-0.5 text-[11px] font-semibold"
                    >
                      {(["date", "relevance"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={sortBy === k}
                          onClick={() => setSortBy(k)}
                          className={`rounded-full px-2.5 py-1 transition-colors ${focusRing} ${
                            sortBy === k
                              ? "bg-white text-brand shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {t(k === "date" ? "search.sortDate" : "search.sortRelevance")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ul
                    ref={listRef}
                    id="site-search-results"
                    role="listbox"
                    className="p-2"
                  >
                    {hits.map((h, i) => (
                      <li
                        key={h.id + h.url}
                        role="option"
                        aria-selected={i === active}
                        id={`site-search-hit-${i}`}
                        data-index={i}
                      >
                        <a
                          href={h.url}
                          onMouseMove={() => i !== active && setActive(i)}
                          className={`group block rounded-lg px-3 py-3 transition-colors ${focusRing} ${
                            i === active ? "bg-brand-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand ring-1 ring-brand-100">
                              {sectionLabel(h.section)}
                            </span>
                            {h.date && (
                              <time
                                dateTime={h.date}
                                className="text-xs font-medium text-slate-500"
                              >
                                {formatDate(h.date, locale)}
                              </time>
                            )}
                            {allLangs && (
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                                {langName[h.lang] ?? h.lang}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-start justify-between gap-3">
                            <h3 className="text-[15px] font-semibold leading-snug text-slate-900">
                              {h.title}
                            </h3>
                            <ArrowRightIcon
                              aria-hidden="true"
                              className={`mt-0.5 hidden size-4 shrink-0 text-brand transition-opacity sm:block ${
                                i === active ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          </div>
                          <p
                            className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 [&_mark]:rounded-sm [&_mark]:bg-amber-100 [&_mark]:px-0.5 [&_mark]:text-slate-900"
                            // Pagefind returns a pre-escaped excerpt with <mark> around matches.
                            dangerouslySetInnerHTML={{ __html: h.excerpt }}
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                  {hits.length < results.length && (
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={loadMore}
                        className={`w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-brand transition-colors hover:border-brand-300 hover:bg-brand-50 ${focusRing}`}
                      >
                        {t("search.more")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer: language scope + keyboard hints */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-xs text-slate-500 sm:px-4">
              <button
                type="button"
                onClick={() => setAllLangs((v) => !v)}
                aria-pressed={allLangs}
                className={`inline-flex items-center gap-2 rounded-md py-1 font-medium ${focusRing}`}
              >
                <span
                  aria-hidden="true"
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    allLangs ? "bg-brand" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                      allLangs ? "translate-x-4" : ""
                    }`}
                  />
                </span>
                <span>
                  {allLangs ? t("search.scopeAll") : t("search.scopeCurrent")}
                </span>
              </button>
              <p className="hidden items-center gap-3 sm:flex" aria-hidden="true">
                <span className="inline-flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> {t("search.nav")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>↵</Kbd> {t("search.select")}
                </span>
              </p>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

function formatDate(iso: string, locale: string) {
  // ISO yyyy-mm-dd, rendered in UTC so the day never shifts with the visitor's timezone.
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function toHit(source: PagefindResult[]) {
  return (d: PagefindResultData, i: number): Hit => ({
    id: source[i].id,
    url: d.url,
    title: d.meta.title ?? d.url,
    excerpt: d.excerpt,
    section: d.filters.section?.[0] ?? "page",
    lang: d.filters.lang?.[0] ?? "",
    date: d.meta.date,
  });
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${focusRing} ${
        active
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-semibold text-slate-500">
      {children}
    </kbd>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center text-slate-500 sm:py-14">
      <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand">
        <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
      </span>
      {children}
    </div>
  );
}
