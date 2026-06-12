import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

export default function Logo({ className, showText = true, onClick }: LogoProps) {
  return (
    <Link 
      href="/" 
      onClick={onClick}
      className={cn("flex items-center gap-4 transition-all hover:opacity-90 active:scale-95 group", className)}
    >
      <div className="relative w-14 h-14 md:w-16 md:h-16 overflow-hidden rounded-xl border border-primary/20 shadow-2xl shadow-black/40 group-hover:border-primary/50 transition-colors">
        <Image
          src="/logo-silver-monumental.png"
          alt="San Rafael 360"
          fill
          sizes="(max-width: 768px) 56px, 64px"
          className="object-cover scale-110"
          priority
        />
      </div>
      {showText && (
        <span className="flex flex-col md:inline text-base leading-none md:text-3xl font-heading font-light tracking-[0.1em] md:tracking-[0.25em] text-white uppercase ml-1 md:ml-2">
          <span className="whitespace-nowrap">San Rafael</span>
          <span className="font-black text-primary tracking-normal text-xl md:text-3xl leading-none"> 360</span>
        </span>
      )}
    </Link>
  );
}
