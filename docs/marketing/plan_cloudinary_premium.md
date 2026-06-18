# Estrategia de Optimización y Monetización: Cloudinary Premium

Este documento define cómo aprovecharemos el plan "Image and Video Small PAYG" de Cloudinary ($29/mes) en San Rafael 360, mejorando la experiencia de usuario (UX) y usándolo como palanca para incentivar suscripciones al plan Premium.

## 1. El Carrusel de Portada y Recorte Inteligente (`g_auto`)
Actualmente la portada es un carrusel de imágenes. El problema común en dispositivos móviles es que al adaptar una foto horizontal a una pantalla vertical, los bordes se recortan y muchas veces el objeto principal de la foto queda fuera de cuadro.

**La Solución:** Aplicar `c_fill,g_auto` (Crop Fill, Gravity Auto) en Cloudinary para todas las imágenes del carrusel.
- **¿Qué hace?** La Inteligencia Artificial de Cloudinary detecta cuál es el sujeto o área de mayor interés de la foto (la fachada de un edificio, un plato de comida, rostros) y asegura que, al recortar para encajar en la pantalla del celular, ese sujeto quede siempre visible y centrado.
- **Por qué ahora:** Esta transformación asistida por IA consume mayor cuota de procesamiento. Con el plan gratuito podía ser riesgoso usarlo en todas las fotos, pero con el plan pago tenemos la libertad de usarlo para garantizar un diseño impecable en todo momento.

## 2. Aprovechar los Videos Existentes en la Galería
Ya tienes videos en las galerías. El manejo de video suele consumir mucho ancho de banda y hacer la web lenta, pero el plan "Image and Video" está hecho exactamente para solucionar esto.

**¿Cómo sacaremos ventaja técnica y de negocio?**
1. **Carga ultrarrápida (Optimización Automática):** Al servir los videos con `f_auto` y `q_auto`, Cloudinary no manda el MP4 original pesado; lo comprime y convierte en tiempo real al formato más ligero soportado por el dispositivo del turista (ej. WebM), sin perder calidad visual. Esto mejora radicalmente el rendimiento de la web (Core Web Vitals).
2. **"Live Thumbnails" (Miniaturas Animadas):** En lugar de tener una imagen estática o un cuadro negro para representar un video en la cuadrícula de la galería, podemos pedirle a Cloudinary que genere automáticamente un GIF corto o un video de baja resolución de 3 segundos para que los videos "cobren vida" sutilmente mientras el usuario navega por la galería, igual que hace YouTube al pasar el mouse por encima.
3. **Videos como Servicio Premium Delegado:** Dado que los propietarios prefieren que San Rafael 360 gestione sus fichas ("Done for You"), usaremos la capacidad de mostrar videos como un fuerte argumento de venta exclusivo del **Plan Premium**. No hace falta programar bloqueos en el Portal del Propietario; simplemente, al vender o renovar suscripciones, ofrecemos la subida de videos promocionales como parte de nuestro servicio VIP de carga de datos.

## 3. Marca de Agua Dinámica (Exclusiva Premium)
Podemos superponer el logo de San Rafael 360 en las fotos de la galería, **pero exclusivamente para negocios Premium**.
- **El Motivo:** Como los negocios gratuitos o no reclamados a menudo usan fotos importadas de Google Places, no es correcto (ni legalmente recomendable) ponerles nuestra marca de agua a fotos que no son nuestras. Sin embargo, para los Premium (cuyas fotos capturamos o curamos nosotros), esto asegura protección de marca.
- **Cómo funciona:** En el frontend verificaremos si el negocio es premium (`negocio.is_premium`). Si lo es, inyectamos el logo dinámicamente (`l_logo_sr360,o_50,g_south_east`). Las fotos originales siguen "limpias" en la base de datos.

## 4. Hoja de Ruta de Implementación Segura
Para no romper nada en producción y entender el impacto, seguiremos estos pasos trabajando **estrictamente en tu entorno local** primero:

1. **Ajuste del Carrusel Local:** Modificaremos el componente del carrusel público para inyectar `g_auto` a las URLs de las fotos y validaremos con las DevTools del navegador cómo se recorta la foto simulando pantallas de celulares y tablets.
2. **Prueba de Optimización de Video Local:** Tomaremos un negocio existente que tenga video, aplicaremos las mejoras de optimización (`f_auto,q_auto`) y crearemos la miniatura animada ("Live Thumbnail"). Mediremos que no se rompa la galería visualmente.
3. **Validación de Marca de Agua:** Haremos una prueba local configurando dinámicamente el logo de San Rafael 360 sobre las fotos ampliadas, asegurándonos de que la opacidad y posición (`g_south_east`) se vean bien en todos los tamaños de pantalla.
4. **Validación Exhaustiva:** Probaremos todo juntos en local. Una vez que estemos 100% satisfechos con el resultado y el rendimiento, seguiremos el protocolo estricto para hacer el push y deploy a producción.
