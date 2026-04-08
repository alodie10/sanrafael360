# Plan de Pruebas de Owner

Este documento contiene el flujo paso a paso para validar que un usuario pueda reclamar un negocio y administrarlo exitosamente.

## Precondiciones
- El administrador debe tener acceso al panel de Strapi (Backend).
- El negocio a probar debe existir en la base de datos.
- El correo del administrador (ej. `diegocristianalonso@gmail.com`) debe estar configurado para recibir notificaciones (SendGrid u otro servicio en producción).

## Fase 1: Habilitar Reclamo en Backend
1. Ingresa a Strapi (ej. Railway).
2. Entra en **Content Manager > Negocio**.
3. Selecciona el negocio a probar (ej. `LA COCINA DE PETTRA`).
4. Activa el campo `reclamar_habilitado = TRUE`.
5. Asegúrate de que `estado_reclamo = ninguno` y no haya `owner` asignado.
6. Guardar cambios.

## Fase 2: Realizar Reclamo en Frontend (Simulación de Usuario)
1. Navega a la web en producción.
2. Ingresa al perfil del negocio previamente habilitado.
3. Verifica que en la columna derecha se vea el bloque color azul indicando **"¿Eres el dueño de este negocio?"**.
4. Haz clic en **Reclamar Perfil**.
5. Al no estar logueado, serás redirigido a la página de `/registro`.
6. Crea una nueva cuenta como el usuario final (ej. Nombre: `Diego Argendeli`, Email: `argendeli01@gmail.com`).
7. El sistema te debe devolver automáticamente a la página del negocio.
8. En el popup de Reclamo, escribe un mensaje con motivo del reclamo (ej. número de contacto).
9. Haz clic en **Enviar Solicitud**.
10. Se debe actualizar el estado visualmente en la misma página mostrando que la **Solicitud está Pendiente** (bloque color amarillo).

## Fase 3: Aprobación (Simulación de Admin)
1. Revisar la bandeja de entrada del administrador. Se debió generar un email de notificación informando de este nuevo reclamo.
2. Regresar al panel de **Strapi (Content Manager > Negocio)**.
3. Abrir el negocio en cuestión.
4. Validar que el campo `owner` ahora corresponda a la cuenta `Diego Argendeli`.
5. Cambiar `estado_reclamo` de `pendiente` a `aprobado`.
6. Guardar cambios.

## Fase 4: Validar Acceso
1. Desde el frontend, y manteniendo la sesión iniciada del usuario `argendeli01@gmail.com`.
2. Dirigirse al navbar y hacer clic en **Portal de Anunciante** (o `/portal`).
3. El panel de usuario debe mostrar el negocio *LA COCINA DE PETTRA*.
4. Hacer clic en "Administrar" (o equivalente) y verificar que se puede modificar la información del perfil privado.
