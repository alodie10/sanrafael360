import styles from "./page.module.css";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";

export default async function Home() {
  const response = await fetchFromStrapi("negocios?populate=*&sort=nombre:asc&pagination[pageSize]=24");
  const negocios = response.data || [];

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Descubre <span>San Rafael</span></h1>
          <p className={styles.subtitle}>El directorio oficial de la ciudad.</p>
        </div>
      </div>

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Negocios Destacados</h2>
        <div className={styles.grid}>
          {negocios.map((negocio: any) => (
            <div key={negocio.id} className={styles.card}>
              <div className={styles.cardHeader}>
                {negocio.imagen_portada?.url ? (
                  <img src={getStrapiMedia(negocio.imagen_portada.url)!} alt={negocio.nombre} />
                ) : (
                  <div className={styles.placeholder}>🖼️</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3>{negocio.nombre}</h3>
                <p>{negocio.descripcion?.substring(0, 100)}...</p>
                <div className={styles.cardFooter}>
                  <span>📍 {negocio.direccion || "San Rafael"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
