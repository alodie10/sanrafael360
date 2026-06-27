const fs = require('fs');

let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf-8');

controllerCode = controllerCode.replace(/async updateValidityManual/g, 'async modificarVigenciaPortal');
controllerCode = controllerCode.replace(/async createManualPayment/g, 'async cargarPagoPortal');
controllerCode = controllerCode.replace(/async deleteManualPayment/g, 'async borrarPagoPortal');

fs.writeFileSync(controllerPath, controllerCode);

let routesPath = 'backend/src/api/negocio/routes/portal-actions.ts';
let routesCode = fs.readFileSync(routesPath, 'utf-8');

routesCode = routesCode.replace(/negocio\.updateValidityManual/g, 'negocio.modificarVigenciaPortal');
routesCode = routesCode.replace(/negocio\.createManualPayment/g, 'negocio.cargarPagoPortal');
routesCode = routesCode.replace(/negocio\.deleteManualPayment/g, 'negocio.borrarPagoPortal');

fs.writeFileSync(routesPath, routesCode);
console.log("Renamed handlers to Spanish to avoid CRUD keywords.");
