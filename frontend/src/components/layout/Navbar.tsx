import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={`${styles.navbar} glass-effect`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          San Rafael <span>360</span>
        </Link>
        <div className={styles.links}>
          <Link href="/alojamientos" className={styles.link}>Alojamientos</Link>
          <Link href="/gastronomia" className={styles.link}>Gastronomía</Link>
          <Link href="/actividades" className={styles.link}>Actividades</Link>
          <Link href="/contacto" className={styles.button}>Agregar Negocio</Link>
        </div>
      </div>
    </nav>
  );
}
