# 🛡️ Security & Content Modeling (San Rafael 360)

## 🛡️ Critical Security Rules (Anti-CORB/CORS)
- **ORB Protection**: `backend/config/middlewares.ts` DEBE tener `crossOriginResourcePolicy: 'cross-origin'` para permitir que Vercel sirva imágenes de Railway.
- **CSP Alignment**: Las directivas `connect-src`, `img-src` y `media-src` deben incluir siempre `*.vercel.app` y los dominios de Railway correspondientes.
- **URL Hardcoding**: `backend/config/server.ts` utiliza una URL fija para producción. Cualquier cambio de dominio debe actualizarse allí primero.

## 📋 Content Modeling (Strapi v5)
- **Document Service API**: Usa siempre el nuevo Document Service API de Strapi 5, evitando el antiguo Query Engine cuando sea posible.
- **Hero Home**: Es un `singleType`. Si devuelve 404, verifica en el Admin Panel que los permisos de `Public` tengan activado `find`.
