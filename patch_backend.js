const fs = require('fs');

// 1. Modificar Rutas
let routesPath = 'backend/src/api/negocio/routes/portal-actions.ts';
let routesCode = fs.readFileSync(routesPath, 'utf-8');

const newRoutes = `    {
      method: 'POST',
      path: '/negocios/admin/pagos',
      handler: 'negocio.adminCreatePayment',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/negocios/admin/pagos/:documentId',
      handler: 'negocio.adminDeletePayment',
      config: { policies: [], middlewares: [] },
    },
  ],
};`;

routesCode = routesCode.replace('  ],\n};', newRoutes);
fs.writeFileSync(routesPath, routesCode);

// 2. Modificar Controlador
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf-8');

const newHandlers = `
  async adminCreatePayment(ctx) {
    try {
      const { monto, estado, fecha_pago, external_reference, negocio, extendMonths } = ctx.request.body;
      
      // Crear el pago
      const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado,
          fecha_pago,
          external_reference,
          negocio
        }
      });

      // Extender vigencia del negocio si se pidió
      if (extendMonths > 0) {
        const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio });
        if (negocioObj) {
          const now = new Date();
          const validUntil = negocioObj.premium_valid_until ? new Date(negocioObj.premium_valid_until) : new Date();
          const baseDate = validUntil < now ? now : validUntil;
          baseDate.setMonth(baseDate.getMonth() + extendMonths);

          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          });
        }
      }

      ctx.send({ success: true, data: newPago });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error creando pago manual");
    }
  },

  async adminDeletePayment(ctx) {
    try {
      const { documentId } = ctx.params;
      await strapi.documents('api::pago.pago').delete({ documentId });
      ctx.send({ success: true });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error eliminando pago");
    }
  }
}));`;

controllerCode = controllerCode.replace('}));', newHandlers);
fs.writeFileSync(controllerPath, controllerCode);

// 3. Modificar Frontend
let frontendPath = 'frontend/src/components/portal/AdminPaymentsView.tsx';
let frontendCode = fs.readFileSync(frontendPath, 'utf-8');

frontendCode = frontendCode.replace('const [updatePremium, setUpdatePremium] = useState(true);', 'const [extendMonths, setExtendMonths] = useState(1);');

const addPaymentOld = `      const pagoData = {
        data: {
          monto: Number(amount),
          estado: 'aprobado',
          fecha_pago: new Date().toISOString(),
          external_reference: notes,
          negocio: selectedBusiness.documentId
        }
      };
      
      const res = await fetch(\`\${strapiUrl}/api/pagos\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${jwt}\` 
        },
        body: JSON.stringify(pagoData)
      });
      
      if (!res.ok) { const err = await res.json(); console.error("Strapi Error:", err); throw new Error(err.error?.message || "Error creando pago"); }

      // 2. Opcional: Actualizar vencimiento del negocio
      if (updatePremium) {
        const now = new Date();
        const validUntil = selectedBusiness.premium_valid_until ? new Date(selectedBusiness.premium_valid_until) : new Date();
        const baseDate = validUntil < now ? now : validUntil;
        baseDate.setMonth(baseDate.getMonth() + 1);

        await fetch(\`\${strapiUrl}/api/negocios/\${selectedBusiness.documentId}\`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: \`Bearer \${jwt}\` 
          },
          body: JSON.stringify({
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          })
        });
      }`;

const addPaymentNew = `      const pagoData = {
        monto: Number(amount),
        estado: 'aprobado',
        fecha_pago: new Date().toISOString(),
        external_reference: notes,
        negocio: selectedBusiness.documentId,
        extendMonths: extendMonths
      };
      
      const res = await fetch(\`\${strapiUrl}/api/negocios/admin/pagos\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${jwt}\` 
        },
        body: JSON.stringify(pagoData)
      });
      
      if (!res.ok) throw new Error("Error creando pago custom");`;

frontendCode = frontendCode.replace(addPaymentOld, addPaymentNew);

frontendCode = frontendCode.replace(
  'fetch(`${strapiUrl}/api/pagos/${documentId}`',
  'fetch(`${strapiUrl}/api/negocios/admin/pagos/${documentId}`'
);

const oldJSX = `<label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={updatePremium}
                        onChange={(e) => setUpdatePremium(e.target.checked)}
                        className="rounded bg-black border-white/10 text-primary focus:ring-0 w-4 h-4"
                      />
                      <span className="text-[11px] text-slate-400">Extender vigencia automáticamente (+1 Mes)</span>
                    </label>`;

const newJSX = `<label className="flex items-center gap-2 cursor-pointer">
                      <select 
                        value={extendMonths}
                        onChange={(e) => setExtendMonths(Number(e.target.value))}
                        className="bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none focus:border-primary/50"
                      >
                        <option value={0}>No extender</option>
                        <option value={1}>+1 Mes</option>
                        <option value={2}>+2 Meses</option>
                        <option value={3}>+3 Meses</option>
                        <option value={6}>+6 Meses</option>
                        <option value={12}>+1 Año</option>
                      </select>
                      <span className="text-[11px] text-slate-400">Vigencia Premium</span>
                    </label>`;

frontendCode = frontendCode.replace(oldJSX, newJSX);
fs.writeFileSync(frontendPath, frontendCode);

console.log("Patch applied successfully!");
