'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % defaultImages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

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
          <img
              src={defaultImages[current]}
              alt="San Rafael"
              className="w-full h-full object-cover brightness-[0.4]"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
    </div>
  );
}
