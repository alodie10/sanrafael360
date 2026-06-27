const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

// The testPublishBug block goes from "async testPublishBug(ctx) {" to "}," before "async adminCreatePayment(ctx) {"
code = code.replace(/async testPublishBug\(ctx\) \{[\s\S]*?ctx\.send\(\{ logs \}\);\n  \},\n/, '');
fs.writeFileSync(controllerPath, code);

let routesPath = 'backend/src/api/negocio/routes/portal-actions.ts';
let rCode = fs.readFileSync(routesPath, 'utf-8');
rCode = rCode.replace(/    \{\n      method: 'GET',\n      path: '\/negocios\/test-publish-bug\/:documentId',[\s\S]*?    \},\n/, '');
fs.writeFileSync(routesPath, rCode);
console.log("Removed test bug");
