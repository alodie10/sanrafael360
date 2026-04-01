"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Alojamientos", href: "/alojamientos" },
  { name: "Gastronomía", href: "/gastronomia" },
  { name: "Actividades", href: "/actividades" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8 py-4",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 py-3" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl font-heading font-extrabold tracking-tighter text-white flex items-center gap-1"
        >
          SAN RAFAEL <span className="text-primary italic">360</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-slate-300"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <button className="p-2 text-slate-300 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>

          <Link
            href="/contacto"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Vende aquí
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
           <Link
            href="/contacto"
            className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white p-1"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/5 p-6 md:hidden flex flex-col gap-6 shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-lg font-semibold transition-colors",
                  pathname === link.href ? "text-primary" : "text-slate-200"
                )}
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
