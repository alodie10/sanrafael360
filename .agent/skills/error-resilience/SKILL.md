# SKILL: Clean Architecture Enforcer
> **Handle:** `@clean-architecture`
> **Ubicación:** `.agent/skills/clean-architecture/SKILL.md`

## Descripción
Revisá y refactorizá código Node.js/Express para que respete una arquitectura limpia en capas. Usá esta skill cuando vayas a crear una feature nueva, refactorizar código existente, o cuando detectes que una capa está haciendo trabajo que no le corresponde.

## Cuándo Activarse
- El agente detecta lógica de negocio en rutas o controllers
- El agente detecta queries a DB fuera del repository
- Se pide crear un nuevo endpoint o feature
- Se pide refactorizar código existente
- El usuario escribe: "aplicá arquitectura limpia", "separar responsabilidades", "refactorizar"

---

## Protocolo de Ejecución

### Paso 1 — Auditoría de Capas
Antes de tocar código, identificar violaciones:

```
CHECKLIST DE AUDITORÍA:
[ ] ¿La ruta tiene lógica de negocio? → Mover a service
[ ] ¿El controller accede a DB directamente? → Crear/usar repository
[ ] ¿El service importa 'express'? → Violación de capa
[ ] ¿Hay lógica duplicada en múltiples controllers? → Extraer a service
[ ] ¿Los archivos tienen más de 200 líneas? → Candidatos a división
```

### Paso 2 — Estructura de Archivos Target

Para cada entidad de dominio (ej: `User`, `Product`, `Order`), crear:

```
src/
├── routes/
│   └── {entidad}.route.js       # GET /api/users, POST /api/users, etc.
├── controllers/
│   └── {entidad}.controller.js  # Maneja req/res, llama servicios
├── services/
│   └── {entidad}.service.js     # Toda la lógica de negocio
├── repositories/
│   └── {entidad}.repository.js  # Toda la interacción con la DB
└── models/
    └── {entidad}.model.js       # Schema/entidad de datos
```

### Paso 3 — Plantillas por Capa

#### Route (`{entidad}.route.js`)
```javascript
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/auth');
const { validate{Entidad} } = require('../middlewares/validators/{entidad}.validator');
const {
  getAll,
  getById,
  create,
  update,
  remove
} = require('../controllers/{entidad}.controller');

router.get('/',    authenticate, asyncHandler(getAll));
router.get('/:id', authenticate, asyncHandler(getById));
router.post('/',   authenticate, validate{Entidad}, asyncHandler(create));
router.put('/:id', authenticate, validate{Entidad}, asyncHandler(update));
router.delete('/:id', authenticate, asyncHandler(remove));

module.exports = router;
```

#### Controller (`{entidad}.controller.js`)
```javascript
const {Entidad}Service = require('../services/{entidad}.service');

// GET /api/{entidades}
const getAll = async (req, res) => {
  const { page = 1, limit = 20, ...filters } = req.query;
  const result = await {Entidad}Service.findAll({ page: +page, limit: +limit, ...filters });
  res.json({ success: true, data: result.items, meta: result.meta });
};

// GET /api/{entidades}/:id
const getById = async (req, res) => {
  const item = await {Entidad}Service.findById(req.params.id);
  res.json({ success: true, data: item });
};

// POST /api/{entidades}
const create = async (req, res) => {
  const item = await {Entidad}Service.create(req.body, req.user);
  res.status(201).json({ success: true, data: item });
};

// PUT /api/{entidades}/:id
const update = async (req, res) => {
  const item = await {Entidad}Service.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: item });
};

// DELETE /api/{entidades}/:id
const remove = async (req, res) => {
  await {Entidad}Service.remove(req.params.id, req.user);
  res.status(204).send();
};

module.exports = { getAll, getById, create, update, remove };
```

#### Service (`{entidad}.service.js`)
```javascript
const {Entidad}Repository = require('../repositories/{entidad}.repository');
const { NotFoundError, ValidationError } = require('../utils/errors');

const findAll = async ({ page, limit, ...filters }) => {
  const offset = (page - 1) * limit;
  const [items, total] = await Promise.all([
    {Entidad}Repository.findMany({ ...filters, limit, offset }),
    {Entidad}Repository.count(filters),
  ]);
  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const findById = async (id) => {
  const item = await {Entidad}Repository.findById(id);
  if (!item) throw new NotFoundError('{Entidad}');
  return item;
};

const create = async (data, currentUser) => {
  // Validaciones de negocio aquí (no de formato — eso va en el validator)
  return {Entidad}Repository.create({ ...data, createdBy: currentUser.id });
};

const update = async (id, data, currentUser) => {
  const existing = await findById(id); // Lanza NotFoundError si no existe
  return {Entidad}Repository.update(id, { ...data, updatedBy: currentUser.id });
};

const remove = async (id, currentUser) => {
  await findById(id); // Verificar existencia
  return {Entidad}Repository.softDelete(id, currentUser.id);
};

module.exports = { findAll, findById, create, update, remove };
```

#### Repository (`{entidad}.repository.js`)
```javascript
// Adaptar según ORM: Sequelize, Prisma, Mongoose, etc.
const { YourModel } = require('../models');

const findMany = async ({ limit, offset, ...where }) => {
  // Ejemplo con Sequelize:
  return YourModel.findAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
  // Ejemplo con Prisma:
  // return prisma.{entidad}.findMany({ where, take: limit, skip: offset });
  // Ejemplo con Mongoose:
  // return {Entidad}Model.find(where).limit(limit).skip(offset);
};

const count = async (where) => YourModel.count({ where });

const findById = async (id) => YourModel.findByPk(id);

const create = async (data) => YourModel.create(data);

const update = async (id, data) => {
  const [, [updated]] = await YourModel.update(data, { where: { id }, returning: true });
  return updated;
};

const softDelete = async (id, deletedBy) => {
  return YourModel.update({ deletedAt: new Date(), deletedBy }, { where: { id } });
};

module.exports = { findMany, count, findById, create, update, softDelete };
```

### Paso 4 — Reportar
Al finalizar la refactorización, generar un reporte con:
- Archivos creados/modificados
- Violaciones de arquitectura corregidas
- Deuda técnica detectada (no resuelta en esta iteración)
- Dependencias npm nuevas requeridas
