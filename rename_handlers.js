const fs = require('fs');

// 1. Rename in controller
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf-8');

controllerCode = controllerCode.replace(/async adminUpdateValidity/g, 'async updateValidityManual');
controllerCode = controllerCode.replace(/async adminCreatePayment/g, 'async createManualPayment');
controllerCode = controllerCode.replace(/async adminDeletePayment/g, 'async deleteManualPayment');

fs.writeFileSync(controllerPath, controllerCode);

// 2. Rename in routes
let routesPath = 'backend/src/api/negocio/routes/portal-actions.ts';
let routesCode = fs.readFileSync(routesPath, 'utf-8');

routesCode = routesCode.replace(/negocio\.adminUpdateValidity/g, 'negocio.updateValidityManual');
routesCode = routesCode.replace(/negocio\.adminCreatePayment/g, 'negocio.createManualPayment');
routesCode = routesCode.replace(/negocio\.adminDeletePayment/g, 'negocio.deleteManualPayment');

fs.writeFileSync(routesPath, routesCode);
console.log("Renamed handlers.");
