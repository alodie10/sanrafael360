/** Extensiones de tipos del navegador usadas en PWA y Meta Pixel. */
interface Navigator {
  /** iOS Safari — true cuando la app corre en modo standalone. */
  standalone?: boolean;
}

interface Window {
  fbq?: (...args: unknown[]) => void;
}
