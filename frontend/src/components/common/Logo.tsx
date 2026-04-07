import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-4 transition-all hover:opacity-90 active:scale-95 group", className)}>
      <div className="relative w-14 h-14 md:w-16 md:h-16 overflow-hidden rounded-xl border border-primary/20 shadow-2xl shadow-black/40 group-hover:border-primary/50 transition-colors">
        <Image
          src="/logo-silver-refined.png"
          alt="San Rafael 360"
          fill
          className="object-cover scale-110"
          priority
        />
      </div>
      {showText && (
        <span className="text-xl md:text-2xl font-serif font-bold tracking-[0.15em] text-white uppercase ml-1">
          San Rafael <span className="text-primary">360</span>
        </span>
      )}
    </Link>
  );
}
