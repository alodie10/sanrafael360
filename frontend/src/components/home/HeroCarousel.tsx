'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFromStrapi, getStrapiMedia } from '@/lib/strapi';

interface HeroData {
  titulo: string;
  subtitulo: string;
  imagenes: any[];
}

const defaultImages = [
  '/images/hero/paisaje-1.jpg',
  '/images/hero/paisaje-2.jpg',
  '/images/hero/paisaje-3.jpg',
  '/images/hero/paisaje-4.jpg',
  '/images/hero/paisaje-5.jpg',
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [images, setImages] = useState<string[]>(defaultImages);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const res = await fetchFromStrapi('hero?populate=*');
        if (res?.data) {
          const data = res.data;
          setHeroData({
            titulo: data.titulo,
            subtitulo: data.subtitulo,
            imagenes: data.imagenes || []
          });

          if (data.imagenes && data.imagenes.length > 0) {
            const urls = data.imagenes.map((img: any) => getStrapiMedia(img.url)).filter(Boolean) as string[];
            if (urls.length > 0) setImages(urls);
          }
        }
      } catch (error) {
        console.error('Error cargando Hero de Strapi:', error);
      }
    };
    loadHero();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={images[current]}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={images[current]}
            alt="San Rafael"
            className="w-full h-full object-cover brightness-[0.4]"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      
      {/* Overlay de Texto si existe en Strapi */}
      {heroData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            key={heroData.titulo}
            className="max-w-4xl text-center"
          >
            {/* El componente principal en page.tsx ya muestra textos, 
                pero esto permite que sean dinámicos si lo deseamos. 
                Por ahora lo dejamos preparado para integrarse con page.tsx */}
          </motion.div>
        </div>
      )}
    </div>
  );
}
