"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Search, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/common/Logo";
import { useSession, signOut } from "next-auth/react";

const navLinks: { name: string; href: string }[] = [];

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

  const { data: session } = useSession();
  const userRole = (session as any)?.user?.role;
  const hasMasterBar = !!session && (userRole === 'Admin' || userRole === 'Propietario' || userRole === 'Authenticated');

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8 py-5",
        hasMasterBar ? "top-10" : "top-0",
        scrolled 
          ? "bg-[#000000]/95 backdrop-blur-xl border-b border-primary/30 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)]" 
          : "bg-[#000000]/60 backdrop-blur-md border-b border-primary/10"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">


          {session ? (
            <div className="flex items-center gap-5">
              <Link
                href="/portal"
                className="flex items-center gap-2 text-slate-200 hover:text-primary transition-all text-sm font-bold group"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Portal
              </Link>
              <button
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href={`/login?callbackUrl=${pathname}`}
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
          )}

          <Link
            href="/contacto"
            className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-full font-bold text-sm active:scale-95 transition-all shadow-[0_0_20px_rgba(255,191,0,0.3)] hover:shadow-[0_0_30px_rgba(255,191,0,0.4)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Vende aquí
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          {session ? (
            <Link href="/portal" className="text-primary hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </Link>
          ) : (
             <Link href={`/login?callbackUrl=${pathname}`} className="text-slate-300 text-xs font-bold uppercase tracking-wider">
              Entrar
            </Link>
          )}
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
            className="absolute top-full left-0 right-0 bg-[#000000]/95 backdrop-blur-2xl border-b border-white/5 p-8 md:hidden flex flex-col gap-8 shadow-2xl"
          >


            {session ? (
              <>
                <Link
                  href="/portal"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-primary"
                >
                  <User className="w-5 h-5" />
                  Mi Portal
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-3 text-lg font-bold text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-lg font-bold text-white"
              >
                <User className="w-5 h-5" />
                Iniciar Sesión
              </Link>
            )}

            <Link
              href="/contacto"
              onClick={() => setIsOpen(false)}
              className="bg-primary text-black py-4 rounded-2xl text-center font-bold text-lg"
            >
              Vende con nosotros
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
