"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";

export default function Home() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [negRes, catRes] = await Promise.all([
          fetchFromStrapi("negocios?populate=*&sort=nombre:asc&pagination[pageSize]=50"),
          fetchFromStrapi("categorias?populate=*&sort=nombre:asc")
        ]);
        setNegocios(negRes.data || []);
        setCategorias(catRes.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <main className={styles.main}>
      {/* SECCIÓN HERO - PAISAJES REALES */}
      <div className={styles.hero}>
        <HeroCarousel />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Vive <span>San Rafael</span></h1>
          <p className={styles.subtitle}>Encuentra las mejores experiencias, gastronomía y alojamiento en el corazón de Mendoza.</p>
          <div className={styles.searchContainer}>
            <input type="text" placeholder="¿Qué estás buscando hoy?" className={styles.searchInput} />
            <button className={styles.searchButton}>Buscar</button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Explorar por Categoría</h2>
        <div className={styles.categoryGrid}>
          {categorias.map((cat: any) => {
            const coverUrl = cat.imagen_portada?.url;
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div className={styles.categoryOverlay}></div>
                {coverUrl ? (
                  <img src={getStrapiMedia(coverUrl)!} alt={cat.nombre} className={styles.categoryImg} />
                ) : (
                  <div className={styles.categoryPlaceholder}>🏔️</div>
                )}
                <div className={styles.categoryInfo}>
                  <h3>{cat.nombre}</h3>
                  <span>{cat.negocios?.length || 0} Lugares</span>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className={styles.sectionTitle}>Negocios Destacados</h2>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Conectando con San Rafael...</p>
          </div>
        ) : negocios.length === 0 ? (
          <div className={styles.loadingState}>
            <p>No se encontraron negocios aún. Asegúrate de que estén publicados en Strapi.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {negocios.map((negocio: any) => {
              const attrs = negocio;
              const logoUrl = attrs.logo?.url;
              const coverUrl = attrs.imagen_portada?.url;
              
              return (
                <div key={negocio.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    {/* Imagen de fondo (portada desenfocada) */}
                    {coverUrl && (
                      <img src={getStrapiMedia(coverUrl)!} alt="" className={styles.cardHeaderImg} />
                    )}
                    
                    {/* Logo central */}
                    <div className={styles.cardLogoWrapper}>
                      {logoUrl ? (
                        <img 
                          src={getStrapiMedia(logoUrl)!} 
                          alt={attrs.nombre} 
                          loading="lazy" 
                        />
                      ) : (
                        <div className={styles.placeholder}>
                          <span>{attrs.nombre?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.categoryBadge}>
                      {attrs.categoria?.nombre || "General"}
                    </div>
                    <h3 className={styles.cardTitle}>{attrs.nombre}</h3>
                    <p className={styles.cardDescription}>
                      {attrs.descripcion 
                        ? attrs.descripcion.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' 
                        : 'Experiencia única en San Rafael.'}
                    </p>
                    <div className={styles.cardFooter}>
                      <span className={styles.location}>📍 {attrs.direccion || "San Rafael"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
