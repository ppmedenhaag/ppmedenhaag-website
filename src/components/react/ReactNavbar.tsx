"use client";
import React, { useState } from "react";
import {
  CloseButton,
  Dialog,
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
import { LANG_LIST, menuData, type LangOptions } from "../../data/i18n.ts";
import type { ui } from "../../data/ui.ts";

interface NavProps {
  locale: LangOptions;
  currentPath: string;
  menu: (typeof menuData)[LangOptions];
  langLinks: { name: string; code: LangOptions; flagUrl: string; path: string }[];
}

export default function NavbarExample(params: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [country, setCountry] = useState(
    params.langLinks.find((l) => l.code === params.locale)
  );

  const localMenu = params.menu;

  return (
    <header className="bg-ppme-blue-50 ">

      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">PPME Den Haag</span>
            <img
              alt=""
              src="/ppme-logo.svg"
              className="w-24 lg:w-32 h-12 lg:h-16"
            />
          </a>
        </div>

        <PopoverGroup className="mx-auto lg:order-last">
          <Popover className="relative">
            <PopoverButton className="w-28 flex flex-nowrap items-center gap-x-1 font-semibold leading-6 text-ppme-blue-900 px-2 py-1 bg-ppme-blue-100 border border-ppme-blue-200 rounded-md">
              <img
                className="h-6 w-auto mr-1.5 rounded-md"
                src={country?.flagUrl}
                alt=""
              />
              <span className="flex-grow text-left">
                {country?.code?.toUpperCase()}
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className="h-5 w-5 flex-none text-ppme-blue-900"
              />
            </PopoverButton>

            <PopoverPanel
              transition
              className="absolute -left-8 top-full z-10 mt-3 w-48 overflow-hidden rounded-md bg-ppme-blue-100 shadow-lg ring-1 ring-ppme-blue-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
            >
              <div className="px-2 py-1">
                {params.langLinks.filter((l) => l.code !== params.locale).map(
                  (item) => (
                    <div
                      key={item.code}
                      className="group relative flex items-center gap-x-6 rounded-lg px-2 py-1 text-md leading-6 hover:bg-ppme-blue-200/50 my-1 mx-2"
                    >
                      <CloseButton  className="flex flex-nowrap items-center mx-2">
                        <img
                          className="h-6 w-auto mr-1.5 rounded-md"
                          src={item.flagUrl}
                          alt=""
                        />
                        <a
                          href={item.path}
                          className="block font-semibold text-ppme-blue-900 py-1 px-2"
                        >
                          {item.name}
                          <span className="absolute inset-0" />
                        </a>
                      </CloseButton>
                    </div>
                  )
                )}
              </div>
            </PopoverPanel>
          </Popover>
        </PopoverGroup>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-ppme-blue-700"
          >
            <span className="sr-only">Menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        <PopoverGroup className="hidden lg:flex lg:gap-x-12 items-center">
          {localMenu?.map(({ text, href, links }) => (
            <div key={text} className="">
              {links?.length ? (
                <Popover className="relative">
                  <PopoverButton className="flex items-center gap-x-1 font-semibold leading-6 text-ppme-blue-900 px-2 py-1">
                    {text}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="h-5 w-5 flex-none text-ppme-blue-900"
                    />
                  </PopoverButton>

                  <PopoverPanel
                    transition
                    className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-sm overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-ppme-blue-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    <div className="p-4">
                      {links.map((item) => (
                        <div
                          key={item.text}
                          className="group relative flex items-center gap-x-6 rounded-lg p-2 text-md leading-6 hover:bg-ppme-blue-50 my-1 mx-2"
                        >
                          <div className="flex-auto">
                            <a
                              href={item.href}
                              className="block font-semibold text-ppme-blue-900 py-1 px-2"
                            >
                              {item.text}
                              <span className="absolute inset-0" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverPanel>
                </Popover>
              ) : (
                <a
                  href={href}
                  className="font-semibold leading-6 text-ppme-blue-900 py-1 px-2"
                >
                  {text}
                </a>
              )}
            </div>
          ))}
        </PopoverGroup>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end"></div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-ppme-blue-50 px-6 py-1.5 sm:max-w-sm sm:ring-1 sm:ring-ppme-blue-900/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">PPME Den Haag</span>
              <img alt="" src="/ppme-logo.svg" className="h-12 w-24" />
            </a>
            <PopoverGroup className="sm:hidden">
              <Popover className="relative">
                <PopoverButton className="w-28 flex flex-nowrap items-center gap-x-1 font-semibold leading-6 text-ppme-blue-900 px-2 py-1 bg-ppme-blue-100 border border-ppme-blue-200 rounded-md">
                  <img
                    className="h-6 w-auto mr-1.5 rounded-md"
                    src={country?.flagUrl}
                    alt=""
                  />
                  <span className="flex-grow text-left">
                    {country?.code?.toUpperCase()}
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="h-5 w-5 flex-none text-ppme-blue-900"
                  />
                </PopoverButton>

                <PopoverPanel
                  transition
                  className="absolute top-full -left-8 z-10 mt-3 w-48 overflow-hidden rounded-md bg-ppme-blue-100 shadow-lg ring-1 ring-ppme-blue-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  <div className="px-2 py-1">
                    {params.langLinks.filter((l) => l.code !== params.locale).map(
                      (item) => (
                        <div
                          key={item.code}
                          className="group relative flex items-center gap-x-6 rounded-lg px-2 py-1 text-md leading-6 hover:bg-ppme-blue-200/50 my-1 mx-2"
                        >
                          <CloseButton className="flex flex-nowrap items-center mx-2">
                            <img
                              className="h-6 w-auto mr-1.5 rounded-md"
                              src={item.flagUrl}
                              alt=""
                            />
                            <a
                              href={item.path}
                              className="block font-semibold text-ppme-blue-900 py-1 px-2"
                            >
                              {item.name}
                              <span className="absolute inset-0" />
                            </a>
                          </CloseButton>
                        </div>
                      )
                    )}
                  </div>
                </PopoverPanel>
              </Popover>
            </PopoverGroup>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-ppme-blue-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-ppme-blue-500/10">
              <div className="space-y-2 py-6">
                {localMenu?.map(({ text, href, links }) => (
                  <div key={text}>
                    {links?.length ? (
                      <Disclosure as="div" className="-mx-3">
                        <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-ppme-blue-900 hover:bg-ppme-blue-50">
                          {text}
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="h-5 w-5 flex-none group-data-[open]:rotate-180"
                          />
                        </DisclosureButton>
                        <DisclosurePanel className="mt-2 space-y-2">
                          {links.map((item) => (
                            <DisclosureButton
                              key={item.text}
                              as="a"
                              href={item.href}
                              className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-ppme-blue-900 hover:bg-ppme-blue-50"
                            >
                              {item.text}
                            </DisclosureButton>
                          ))}
                        </DisclosurePanel>
                      </Disclosure>
                    ) : (
                      <a
                        href={href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-ppme-blue-900 hover:bg-ppme-blue-50"
                      >
                        {text}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
