"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ChevronUp } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavigationFABProps {
  isVisible: boolean;
  type?: 'reset' | 'back' | 'top';
  onClick: () => void;
  label?: string;
}

export default function NavigationFAB({ 
  isVisible, 
  type = 'top', 
  onClick, 
  label 
}: NavigationFABProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const isExpanded = type === 'reset' || type === 'back';

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[9999]"
        >
          <button
            onClick={onClick}
            className={cn(
              "flex items-center transition-all duration-500 group relative",
              "bg-zinc-950/90 backdrop-blur-2xl border border-primary/40 text-white",
              "shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:border-primary/80 active:scale-95",
              isExpanded ? "px-6 py-4 rounded-full gap-3" : "p-4 rounded-2xl"
            )}
          >
            {/* Brillo dinámico de fondo */}
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className={cn(
              "flex items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 transition-transform duration-500",
              isExpanded ? "w-8 h-8" : "w-6 h-6 group-hover:-translate-y-1"
            )}>
              {type === 'top' && <ChevronUp className="w-4 h-4 text-black" />}
              {type === 'reset' && <ArrowRight className="w-4 h-4 text-black -rotate-90 group-hover:-translate-y-1 transition-transform" />}
              {type === 'back' && <ArrowLeft className="w-4 h-4 text-black group-hover:-translate-x-1 transition-transform" />}
            </div>

            {isExpanded && (
              <span className="font-bold text-sm tracking-tight uppercase">
                {label || (type === 'back' ? 'Volver' : 'Volver')}
              </span>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
