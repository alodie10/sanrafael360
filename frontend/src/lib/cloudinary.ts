/**
 * Optimiza URLs de Cloudinary inyectando parámetros de transformación.
 * @param url La URL original de la imagen (debe ser de Cloudinary)
 * @param transformations Los parámetros de transformación (ej. 'c_fill,g_auto,f_auto,q_auto')
 * @returns La URL optimizada o la original si no es de Cloudinary
 */
export function optimizeCloudinaryUrl(url: string | null | undefined, transformations: string = "f_auto,q_auto"): string {
  if (!url) return "";
  
  // Si no es de Cloudinary, no hacemos nada para no romperla
  if (!url.includes("res.cloudinary.com")) return url;

  // Si ya tiene parámetros de transformación explícitos que inyectamos antes, devolvemos como está
  // o si no queremos pisar transformaciones de Strapi. La forma más segura de inyectar
  // es buscar el segmento "/upload/" y meter la transformación justo después.
  const parts = url.split('/upload/');
  
  if (parts.length === 2) {
    // Si ya contiene la transformación exacta, devolvemos
    if (parts[1].startsWith(`${transformations}/`)) {
      return url;
    }
    
    // Inyectamos la transformación
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
  }
  
  return url;
}
