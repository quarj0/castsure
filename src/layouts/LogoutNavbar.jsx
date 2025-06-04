import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const navigation = [
    {
      name: "Home",
      href: "/",
      current: location.pathname === "/",
    },
    {
      name: "Services",
      href: "/services",
      current: location.pathname === "/services",
    },
    {
      name: "About",
      href: "/about",
      current: location.pathname === "/about",
    },
    {
      name: "Contact",
      href: "/contact",
      current: location.pathname === "/contact",
    },
    {
      name: "Login",
      href: "/login",
      current: location.pathname === "/login",
    },
  ];

  return (
    <Disclosure
      as="nav"
      className="bg-gray-50 shadow-transparent sticky w-full z-10 top-0     "
    >
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex-shrink-0">
                  <Link to={"/"} className="font-poppins font-semibold text-sunset-700">castsure.vote</Link>
                </div>
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`text-primary-500 hover:bg-primary-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${
                          item.current ? "bg-primary-600 text-white" : ""
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={`text-primary-400 hover:bg-primary-500 hover:text-gray-50 block px-3 py-2 rounded-md text-base font-medium ${
                    item.current ? "bg-primary-700 text-gray-50" : ""
                  }`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
