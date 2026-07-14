# Clientes y avisos (Sprint 6) — ops en develop

## Modelo
- 1 **Cliente** = 1 email único.
- 1 Cliente → 1..N **Negocios** (vínculo manual; los negocios pueden existir sin cliente).
- `opt_out = true` → no recibe broadcast.

## Dónde vive
- Portal: `/portal/admin` → pestaña **Clientes y avisos**.
- APIs (admin JWT + `require-admin`): `/api/clientes/admin…` y `/api/clientes/admin/mail/test|broadcast`.
- Baja pública: `/baja?token=…` (front) → `GET /api/clientes/baja?token=…` (Strapi).

## Flujo recomendado
1. Crear cliente (email + nombre).
2. Vincular negocio(s) con el buscador.
3. Redactar asunto + cuerpo con el **editor visual** (negrita, links, imágenes Cloudinary).
4. **Mail de prueba** (va al email del admin de la sesión, prefijo `[PRUEBA]`).
5. Revisar el correo en Resend / inbox (pie con link de baja si el destinatario existe como Cliente).
6. Broadcast: sin checkboxes = todos sin opt-out; con checkboxes = solo selección. Cada mail trae su link firmado.
7. Historial breve también en **Log de actividad** (`Mail prueba` / `Mail broadcast` / `Cliente opt-out`).

## Editor de avisos
- TipTap en el panel: no hace falta escribir HTML a mano.
- Imágenes = URL en Cloudinary (`folder` `sanrafael360_avisos`), no adjuntos MIME.
- Podés **pegar o arrastrar** capturas al cuerpo del mensaje (además del botón de imagen).
- Credenciales Cloudinary del frontend deben coincidir con el backend.
- Pie: link **darte de baja con un clic** (firma HMAC). No depende de responder el mail.

## Requisitos
- Backend: `RESEND_*`, `JWT_SECRET` (firma de baja), `FRONTEND_URL` (dominio del link).
- Probar primero en **develop**; no promover a `master` hasta validar prueba + un envío chico.
