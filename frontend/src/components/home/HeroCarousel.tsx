'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/page.module.css';

const images = [
  '/images/hero/paisaje-1.jpg',
  '/images/hero/paisaje-2.jpg',
  '/images/hero/paisaje-3.jpg',
  '/images/hero/paisaje-4.jpg',
  '/images/hero/paisaje-5.jpg',
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.carousel}>
      {images.map((img, index) => (
        <img
          key={img}
          src={img}
          alt={`San Rafael Paisaje ${index + 1}`}
          className={`${styles.carouselImage} ${index === current ? styles.active : ''}`}
        />
      ))}
      <div className={styles.heroOverlay}></div>
    </div>
  );
}
