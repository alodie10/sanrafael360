import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Descubre <span>San Rafael</span></h1>
          <p className={styles.subtitle}>
            El directorio oficial con los mejores hoteles, restaurantes y actividades de la ciudad.
          </p>
          <div className={styles.searchContainer}>
            <input type="text" placeholder="¿Qué estás buscando? (Ej. Cabañas, Bodegas...)" className={styles.searchInput} />
            <button className={styles.searchButton}>Buscar</button>
          </div>
        </div>
        <div className={styles.heroBackground}></div>
      </div>
    </main>
  );
}
