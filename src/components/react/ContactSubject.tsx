"use client";

import { useState } from "react";
import {
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { SubjectData } from "../../data/contact";
import type { LangOptions } from "../../data/i18n";

interface Props {
  locale: LangOptions;
  label: string;
}

// The first entry in SubjectData is a " - " placeholder: shown as "—",
// submitted as an empty value ("").
export default function ContactSubject({ locale, label }: Props) {
  const subjects = SubjectData[locale].map((s) =>
    s.text.trim() === "-" ? "" : s.text.trim(),
  );
  const [selected, setSelected] = useState(subjects[0]);
  const display = (v: string) => v || "—";

  return (
    <Field>
      <Label className="field-label">{label}</Label>
      <Listbox
        value={selected}
        onChange={setSelected}
        name="subject"
      >
        <div className="relative">
          <ListboxButton className="field relative cursor-pointer pr-10 text-left data-open:border-brand data-open:ring-2 data-open:ring-brand/30 data-focus:border-brand data-focus:ring-2 data-focus:ring-brand/30">
            <span
              className={`block truncate ${selected === "" ? "text-slate-500" : ""}`}
            >
              {display(selected)}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <ChevronUpDownIcon
                aria-hidden="true"
                className="size-5 text-slate-400"
              />
            </span>
          </ListboxButton>

          <ListboxOptions
            transition
            anchor="bottom start"
            className="z-20 mt-1 w-(--button-width) overflow-auto rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-lg [--anchor-gap:4px] [--anchor-max-height:16rem] focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
          >
            {subjects.map((s) => (
              <ListboxOption
                key={s}
                value={s}
                className="group flex cursor-pointer select-none items-center gap-2 rounded-md py-2 pr-3 pl-2 text-slate-800 data-focus:bg-brand data-focus:text-white"
              >
                <CheckIcon
                  aria-hidden="true"
                  className="invisible size-4 shrink-0 text-brand group-data-focus:text-white group-data-selected:visible"
                />
                <span className="block truncate group-data-selected:font-semibold">
                  {display(s)}
                </span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </Field>
  );
}
