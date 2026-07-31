'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const defaultImages = [
  '/images/hero/lago-y-montana.jpg',
  '/images/hero/laguna-encantada.jpg',
  '/images/hero/rafting.jpg',
  '/images/hero/rio-atuel-sosneado.jpg',
  '/images/hero/sosneado.jpg',
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
    <div className="absolute inset-0 overflow-hidden -z-10">
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
              alt="San Rafael"
              fill
              priority={current === 0}
              sizes="100vw"
              quality={70}
              className="object-cover brightness-[0.65] contrast-[1.1]"
              onError={() => handleImageError(defaultImages[current])}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-background/40" />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
