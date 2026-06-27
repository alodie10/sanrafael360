const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/portal/AdminPaymentsView.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Icons
content = content.replace(
  '  ChevronRight\n} from "lucide-react";',
  '  ChevronRight,\n  Plus, X, Trash2\n} from "lucide-react";'
);

// 2. Add State
content = content.replace(
  '  const [filterType, setFilterType] = useState<\'all\' | \'premium\' | \'expired\' | \'expiring\'>(\'premium\');',
  `  const [filterType, setFilterType] = useState<'all' | 'premium' | 'expired' | 'expiring'>('premium');

  // Estados para Modal de Pagos
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatePremium, setUpdatePremium] = useState(true);

  // Mantener el negocio seleccionado actualizado tras recargar la data
  useEffect(() => {
    if (selectedBusiness) {
      const updated = data.find(b => b.id === selectedBusiness.id);
      if (updated) setSelectedBusiness(updated);
    }
  }, [data]);`
);

// 3. Update useEffect deps
content = content.replace(
  '  }, [jwt, searchTerm, filterType]);',
  '  }, [jwt, searchTerm, filterType, refreshTrigger]);'
);

// 4. Add handlers right before `const processedData = useMemo`
const handlers = `
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !selectedBusiness) return;
    
    setIsSubmitting(true);
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      
      // 1. Crear el pago
      const pagoData = {
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
      
      if (!res.ok) throw new Error("Error creando pago");

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
      }

      setAmount("");
      setNotes("");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error agregando pago:", err);
      alert("Error al guardar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (documentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pago?")) return;
    
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const res = await fetch(\`\${strapiUrl}/api/pagos/\${documentId}\`, {
        method: 'DELETE',
        headers: { Authorization: \`Bearer \${jwt}\` }
      });
      if (!res.ok) throw new Error("Error eliminando pago");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error eliminando pago:", err);
      alert("Error al eliminar el pago");
    }
  };

`;

content = content.replace(
  '  const processedData = useMemo(() => {',
  handlers + '  const processedData = useMemo(() => {'
);

// 5. Add onClick to TR
content = content.replace(
  '<tr key={negocio.id} className="hover:bg-white/[0.02] transition-colors group">',
  '<tr key={negocio.id} onClick={() => setSelectedBusiness(negocio)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">'
);

// 6. Add Modal UI at the end of the return
const modalUI = `
      {/* Modal de Pagos */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{selectedBusiness.nombre}</h3>
                <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">
                  Gestión de Pagos {selectedBusiness.is_premium ? '• ELITE' : '• BÁSICO'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedBusiness(null)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Contenido (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Formulario de Carga */}
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Nuevo Pago
                </h4>
                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black mb-1.5">Monto ($)</label>
                      <input 
                        type="number" 
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                        placeholder="Ej: 29000"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-[10px] text-slate-500 uppercase font-black mb-1.5">Referencia / Notas</label>
                      <input 
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                        placeholder="Ej: Transf. Banco Galicia"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={updatePremium}
                        onChange={(e) => setUpdatePremium(e.target.checked)}
                        className="rounded bg-black border-white/10 text-primary focus:ring-0 w-4 h-4"
                      />
                      <span className="text-[11px] text-slate-400">Extender vigencia automáticamente (+1 Mes)</span>
                    </label>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "Guardando..." : "Cargar Pago"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Historial de Pagos */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" /> Historial de Transacciones
                </h4>
                
                <div className="space-y-3">
                  {(!selectedBusiness.pagos || (Array.isArray(selectedBusiness.pagos) ? selectedBusiness.pagos : (selectedBusiness.pagos.data || [])).length === 0) ? (
                    <p className="text-center text-slate-500 italic text-sm py-4">No hay pagos registrados.</p>
                  ) : (
                    (Array.isArray(selectedBusiness.pagos) ? selectedBusiness.pagos : (selectedBusiness.pagos.data || []))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((pago: any) => (
                      <div key={pago.id || pago.documentId} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                            <CreditCard className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">$ {pago.monto?.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                              {formatDate(pago.fecha_pago || pago.createdAt)}
                              {pago.external_reference && \` • \${pago.external_reference}\`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded border border-green-500/20">
                            {pago.estado || 'aprobado'}
                          </span>
                          <button 
                            onClick={() => handleDeletePayment(pago.documentId)}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar Pago"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  '    </div>\n  );\n}',
  modalUI + '    </div>\n  );\n}'
);

fs.writeFileSync(filePath, content);
console.log("File updated successfully.");
