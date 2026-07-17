"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  // No mostrar en sub-vistas del portal (admin/negocios), ni en login
  if ((pathname.startsWith('/portal') && pathname !== '/portal') || pathname === '/login' || pathname === '/registro') {
    return null;
  }

  const links = [
    {
      name: "Explora",
      href: "/",
      icon: Search,
    },
    {
      name: "Ofertas",
      href: "/ofertas",
      icon: Tag,
    },
    {
      name: "Favoritos",
      href: "/favoritos",
      icon: Heart,
    },
    {
      name: "Perfil",
      href: "/portal",
      icon: User,
    },
  ];

  // Altura real de la barra + aire extra para que nombres/ratings de fichas
  // no queden tapados cuando hay pocas filas (ej. 4 comercios en 2 columnas).
  const bottomClearance =
    "h-[calc(4.25rem+env(safe-area-inset-bottom,0px)+3.25rem)]";

  return (
    <>
      <div className={cn("md:hidden shrink-0", bottomClearance)} aria-hidden="true" />
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around px-2 py-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px]",
                  isActive ? "text-primary" : "text-slate-400 hover:text-slate-300"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
