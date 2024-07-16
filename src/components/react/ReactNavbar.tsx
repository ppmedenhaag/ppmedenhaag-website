import { useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'
import { menuData } from "../../data/i18n.js";

interface NavProps {
  locale: string;
  currentPath: string;
}


const langs = [{text:"NL", href:"#"}, {text:"ID", href:"#"}, {text:"EN", href:"#"}]

const products = [
  { name: 'Analytics', description: 'Get a better understanding of your traffic', href: '/blog', icon: ChartPieIcon },
  { name: 'Engagement', description: 'Speak directly to your customers', href: '#', icon: CursorArrowRaysIcon },
  { name: 'Security', description: 'Your customers’ data will be safe and secure', href: '#', icon: FingerPrintIcon },
  { name: 'Integrations', description: 'Connect with third-party tools', href: '#', icon: SquaresPlusIcon },
  { name: 'Automations', description: 'Build strategic funnels that will convert', href: '#', icon: ArrowPathIcon },
]
const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
]

export default function NavbarExample(params:NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const localMenu = menuData.get(params.locale);

  return (
    <header className="bg-ppme-blue-50 ">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">PPME Den Haag</span>
            <img alt="" src="/ppme-logo.svg" className="h-12 lg:h-[5rem] w-auto" />
          </a>
        </div>
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
        
        <PopoverGroup className="hidden lg:flex lg:gap-x-12 ">
        {localMenu?.map (({ text, href, links }) => (
          <>
          {links?.length ? (
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-lg font-semibold leading-6 text-ppme-blue-900 px-2 py-1">
              {text}
              <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-ppme-blue-900" />
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
                      <a href={item.href} className="block font-semibold text-ppme-blue-900 py-1 px-2">
                        {item.text}
                        <span className="absolute inset-0" />
                      </a>

                    </div>
                  </div>
                ))}
              </div>
              
            </PopoverPanel>
          </Popover>
          ):(<a href={href} className="text-lg font-semibold leading-6 text-ppme-blue-900 py-1 px-2">{text}</a>)}
          </>
        ))}
        </PopoverGroup>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="#" className="text-sm font-semibold leading-6 text-ppme-blue-900">
            Log in <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-ppme-blue-900/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">PPME Den Haag</span>
              <img
                alt=""
                src="/ppme-logo.svg"
                className="h-12 w-auto"
              />
            </a>
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
              {localMenu?.map (({ text, href, links }) => (
          <>
          {links?.length ? (                
                <Disclosure as="div" className="-mx-3">
                  <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-ppme-blue-900 hover:bg-ppme-blue-50">
                    {text}
                    <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none group-data-[open]:rotate-180" />
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
          ):(<a href={href} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-ppme-blue-900 hover:bg-ppme-blue-50">{text}</a>)}
          </>
        ))}
              </div>
              <div className="py-6">
                <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-ppme-blue-900 hover:bg-ppme-blue-50"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
