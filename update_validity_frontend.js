const fs = require('fs');
let frontendPath = 'frontend/src/components/portal/AdminPaymentsView.tsx';
let frontendCode = fs.readFileSync(frontendPath, 'utf-8');

// 1. Add State
frontendCode = frontendCode.replace(
  'const [extendMonths, setExtendMonths] = useState(1);',
  `const [extendMonths, setExtendMonths] = useState(1);
  const [manualDate, setManualDate] = useState("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);`
);

// 2. Add useEffect to sync manualDate with selectedBusiness
frontendCode = frontendCode.replace(
  'if (updated) setSelectedBusiness(updated);',
  `if (updated) {
        setSelectedBusiness(updated);
        if (updated.premium_valid_until) {
          setManualDate(updated.premium_valid_until.split('T')[0]);
        } else {
          setManualDate("");
        }
      }`
);

// We also need to set it when opening the modal (when onClick happens), but since we can't easily hook into the onClick without a lot of regex, we can just use an effect that watches selectedBusiness.id
frontendCode = frontendCode.replace(
  '  // Mantener el negocio seleccionado actualizado tras recargar la data',
  `  useEffect(() => {
    if (selectedBusiness && selectedBusiness.premium_valid_until) {
      setManualDate(selectedBusiness.premium_valid_until.split('T')[0]);
    } else {
      setManualDate("");
    }
  }, [selectedBusiness?.id]);
  
  // Mantener el negocio seleccionado actualizado tras recargar la data`
);

// 3. Add handler
const handlerCode = `
  const handleUpdateValidity = async () => {
    if (!selectedBusiness) return;
    setIsUpdatingDate(true);
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const res = await fetch(\`\${strapiUrl}/api/negocios/admin/vigencia/\${selectedBusiness.documentId}\`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${jwt}\` 
        },
        body: JSON.stringify({ premium_valid_until: manualDate || null })
      });
      if (!res.ok) throw new Error("Error al guardar la vigencia");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la fecha");
    } finally {
      setIsUpdatingDate(false);
    }
  };

`;

frontendCode = frontendCode.replace(
  '  const handleDeletePayment = async (documentId: string) => {',
  handlerCode + '  const handleDeletePayment = async (documentId: string) => {'
);


// 4. Add UI
const uiCode = `
              {/* Correccion Manual de Vigencia */}
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Vencimiento de Suscripción
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Si hubo un error, puedes corregir la fecha de fin de Premium manualmente.</p>
                </div>
                <div className="flex gap-2 items-center">
                  <input 
                    type="date" 
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 text-xs w-full md:w-auto"
                  />
                  <button 
                    onClick={handleUpdateValidity}
                    disabled={isUpdatingDate}
                    className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-xl transition-colors shrink-0 disabled:opacity-50"
                    title="Guardar Fecha Exacta"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Formulario de Carga */}
`;

frontendCode = frontendCode.replace(
  '{/* Formulario de Carga */}',
  uiCode
);

fs.writeFileSync(frontendPath, frontendCode);
console.log("Frontend patched!");
