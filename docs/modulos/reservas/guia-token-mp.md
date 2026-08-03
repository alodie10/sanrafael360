# Guía — Token de cobros Mercado Pago (no técnica)

Para activar cobros reales en el módulo de reservas de San Rafael 360.

**No le pedís “un secret de API”.** Le pedís el texto que Mercado Pago llama **Access Token** (acá: **token de cobros**).

## Pasos

1. Entrar a [Mercado Pago Developers → Aplicaciones](https://www.mercadopago.com.ar/developers/panel/app) con el usuario MP **del local**.
2. Abrir (o crear) **su aplicación**.
3. Ir a **Credenciales de prueba** (sandbox) o **de producción** (cuando cobren en serio).
4. Copiar solo el **Access Token** (suele empezar con `APP_USR-` o `TEST-`). No el Public Key.
5. Pegarlo en el portal SR360 → Reservas → Configuración → **Token de cobros** → Guardar.

Después se puede apagar **Modo simulación** y cobrar.

## Quién lo carga

Hasta OAuth (E4), solo un **admin de San Rafael 360** pega el token en el portal. El dueño puede seguir estos pasos y pasar el texto al admin, o hacerlo juntos en una videollamada.

## Referencia en producto

La misma guía está expandible en el portal (`ReservasMpTokenGuide`).
