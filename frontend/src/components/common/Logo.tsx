import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 transition-transform hover:scale-105 active:scale-95", className)}>
      <div className="relative w-10 h-10 md:w-12 md:h-12">
        <Image
          src="/logo-gold.png"
          alt="San Rafael 360 Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className="text-xl md:text-2xl font-heading font-extrabold tracking-tighter text-white uppercase italic">
          San Rafael <span className="text-primary">360</span>
        </span>
      )}
    </Link>
  );
}
