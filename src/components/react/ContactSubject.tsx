"use client";

import { useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { SubjectData } from "../../data/contact";
import type { LangOptions, locales } from "../../data/i18n";


interface Props {
  locale: LangOptions;
}
export default function ContactSubject(params: Props) {
  const subjects = SubjectData[params.locale];
  const [selected, setSelected] = useState(subjects[0]);

  return (
    <Listbox value={selected} onChange={setSelected} name="subject">
      <div className="relative mt-2">
        <ListboxButton className="relative w-80 cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-ppme-blue-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
          <span className="block truncate">{selected.text}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              aria-hidden="true"
              className="h-5 w-5 text-ppme-blue-500"
            />
          </span>
        </ListboxButton>

        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-60 w-80  overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
        >
          {subjects.map((s) => (
            <ListboxOption
              key={s.text}
              value={s}
              className="group relative cursor-default select-none py-2 pl-3 pr-9 text-ppme-blue-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
            >
              <span className="block truncate font-normal group-data-[selected]:font-semibold">
                {s.text}
              </span>

              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                <CheckIcon aria-hidden="true" className="h-5 w-5" />
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
