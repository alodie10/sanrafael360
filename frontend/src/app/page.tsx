"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";

export default function Home() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNegocios = async () => {
      try {
        const response = await fetchFromStrapi("negocios?populate=*&sort=nombre:asc&pagination[pageSize]=24");
        setNegocios(response.data || []);
      } catch (error) {
        console.error("Error cargando negocios:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNegocios();
  }, []);

  return (
    <main className={styles.main}>
      {/* SECCIÓN HERO - CARGA INSTANTÁNEA */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Descubre <span>San Rafael</span></h1>
          <p className={styles.subtitle}>El directorio oficial de la ciudad.</p>
          <div className={styles.searchContainer}>
            <input type="text" placeholder="¿Qué buscás?" className={styles.searchInput} />
            <button className={styles.searchButton}>Buscar</button>
          </div>
        </div>
        <div className={styles.heroBackground}></div>
      </div>

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Negocios Destacados</h2>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Buscando lo mejor de San Rafael...</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {negocios.map((negocio: any) => {
              const attributes = negocio; // Strapi 5 root attributes
              const imageUrl = attributes.imagen?.url;
              
              return (
                <div key={negocio.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    {imageUrl ? (
                      <img 
                        src={getStrapiMedia(imageUrl)!} 
                        alt={attributes.nombre} 
                        className={styles.logoImage}
                        loading="lazy" 
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        <span>{attributes.nombre?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.categoryBadge}>
                      {attributes.categoria?.nombre || "General"}
                    </div>
                    <h3 className={styles.cardTitle}>{attributes.nombre}</h3>
                    <p className={styles.cardDescription}>
                      {attributes.descripcion 
                        ? attributes.descripcion.substring(0, 70) + '...' 
                        : 'Experiencia única en San Rafael.'}
                    </p>
                    <div className={styles.cardFooter}>
                      <span className={styles.location}>📍 {attributes.direccion || "San Rafael"}</span>
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
