# Registro de specs

Aquí viven los specs de features y de bugs. El proceso y los campos obligatorios están en [`SPEC_DRIVEN_DEVELOPMENT.md`](../SPEC_DRIVEN_DEVELOPMENT.md).

## Convenciones

- Usar el siguiente ID `SDD-####` libre y un nombre corto en kebab-case.
- Un spec por cambio cohesivo.
- Agrupar los specs de un subsistema en `specs/<subsistema>/` cuando ayude a encontrarlos, con un README en esa carpeta.
- Sumar cada spec nuevo a este índice con su estado actual.
- Conservar los specs cerrados. Un spec reemplazado queda en `Superseded` y enlaza al que lo reemplaza.
- La documentación de dependencias y de paquetes no va en esta carpeta.

## Specs

| ID | Título | Estado | Archivo |
| --- | --- | --- | --- |
| SDD-0001 | Adoptar el desarrollo guiado por specs | Verified | [`SDD-0001-adoptar-specs.md`](SDD-0001-adoptar-specs.md) |
| SDD-0002 | Mail en el CRM de captación | Implemented | [`SDD-0002-crm-envio-mail.md`](SDD-0002-crm-envio-mail.md) |
| SDD-0003 | Slug de ficha al crear la mesa Prospector | Implemented | [`SDD-0003-crm-slug-desde-ficha.md`](SDD-0003-crm-slug-desde-ficha.md) |

## Plantilla

Copiar [`TEMPLATE.md`](TEMPLATE.md), asignar el siguiente ID y reemplazar cada marcador antes de pasar el spec a `Approved`.

## Patrones de prompt

- Abrir un cambio: `Crear o actualizar SDD-#### para <cambio>; no implementar hasta cerrar requisitos y criterios de aceptación.`
- Continuar un cambio aprobado: `Implementar SDD-#### dentro de su alcance aprobado y actualizar la tabla de trazabilidad.`
- Cerrar un cambio: `Correr los checks permitidos, registrar la evidencia de cada requisito y criterio, y fijar el estado del spec según los resultados.`
- Si el comportamiento pedido es ambiguo, crear un spec en `Draft` y resolver la ambigüedad antes de implementar.
