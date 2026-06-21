"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  // No mostrar en la vista de portal de negocios para dueños, ni login
  if (pathname.startsWith('/portal') || pathname === '/login' || pathname === '/registro') {
    return null;
  }

  const links = [
    {
      name: "Explora",
      href: "/",
      icon: Search,
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

  return (
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
  );
}
