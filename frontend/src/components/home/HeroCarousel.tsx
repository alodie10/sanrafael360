'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const defaultImages = [
  '/images/hero/vinedos-san-rafael.jpg',
  '/images/hero/canon-del-atuel.jpg',
  '/images/hero/valle-grande.jpg',
  '/images/hero/bodega-barricas.jpg',
  '/images/hero/gastronomia-san-rafael.jpg',
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const failedImages = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => {
        let next = (prev + 1) % defaultImages.length;
        let attempts = 0;
        while (failedImages.current.has(defaultImages[next]) && attempts < defaultImages.length) {
          next = (next + 1) % defaultImages.length;
          attempts++;
        }
        return next;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleImageError = (src: string) => {
    failedImages.current.add(src);
    setCurrent((prev) => {
      let next = (prev + 1) % defaultImages.length;
      let attempts = 0;
      while (failedImages.current.has(defaultImages[next]) && attempts < defaultImages.length) {
        next = (next + 1) % defaultImages.length;
        attempts++;
      }
      return next;
    });
  };

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <AnimatePresence mode="wait">
        <motion.div
            key={defaultImages[current]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0"
        >
          <Image
              src={defaultImages[current]}
              alt="San Rafael, Mendoza"
              fill
              priority={current === 0}
              sizes="100vw"
              quality={75}
              className="object-cover brightness-[0.85] contrast-[1.05]"
              onError={() => handleImageError(defaultImages[current])}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-black/20 pointer-events-none" />
    </div>
  );
}
