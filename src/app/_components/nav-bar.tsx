"use client";

import { useState } from "react";
import { easeOut, motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isBlogPage = pathname.startsWith("/blog");

  const navLinks = [
    { name: "About", href: "/#about" },
    { name: "Experience", href: "/#experience" },
    { name: "Projects", href: "/#projects" },
    { name: "Contact", href: "/#contact" },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-b-surface2"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-xl font-bold text-rosewater hover:text-flamingo transition-colors"
            >
              Fabio Canavarro
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {!isBlogPage &&
                navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-subtext1 hover:text-text px-3 py-2 rounded-md font-medium transition-colors"
                  >
                    {link.name}
                  </Link>
                ))
              }
              {
                isBlogPage && (
                  <Link
                    href="/"
                    className="text-subtext1 hover:text-text px-3 py-2 rounded-md font-medium transition-colors"
                  >
                    Home
                  </Link>
                )
              }
              <Link
                href="/blog"
                className="text-subtext1 hover:text-text px-3 py-2 rounded-md font-medium transition-colors bg-mauve/10 border border-mauve/20"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-subtext1 hover:text-text hover:bg-surface0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {!isBlogPage &&
                navLinks.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-subtext1 hover:text-text hover:bg-surface0 block px-3 py-2 rounded-md font-medium transition-colors"
                  >
                    {link.name}
                  </motion.a>
                ))
              }
              {isBlogPage &&
                <motion.a
                  key="home"
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="text-subtext1 hover:text-text hover:bg-surface0 block px-3 py-2 rounded-md font-medium transition-colors"
                >
                  Home
                </motion.a>
              }
              
              <motion.div
              >
                <Link
                  href="/blog"
                  onClick={() => setIsOpen(false)}
                  className="text-subtext1 hover:text-text bg-mauve/10 block px-3 py-2 rounded-md font-medium transition-colors"
                >
                  Blog
                </Link>

              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;