"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Oferta } from "@/types/strapi";
import { fetchFromStrapi } from "@/lib/strapi";

interface EditBusinessOffersProps {
  negocioId: string;
  session: any;
}

export default function EditBusinessOffers({ negocioId, session }: EditBusinessOffersProps) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOferta, setEditingOferta] = useState<Oferta | null>(null);

  // Form states
  const [titulo, setTitulo] = useState("");
  const [tipoOferta, setTipoOferta] = useState<"Descuento" | "Promocion2x1" | "Regalo" | "Especial">("Descuento");
  const [descripcion, setDescripcion] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState<number | "">("");
  const [precioDescuento, setPrecioDescuento] = useState<number | "">("");
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number | "">("");
  const [validaDesde, setValidaDesde] = useState("");
  const [validaHasta, setValidaHasta] = useState("");
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    fetchOfertas();
  }, [negocioId]);

  const fetchOfertas = async () => {
    try {
      const res = await fetchFromStrapi(
        `ofertas?filters[negocio][documentId][$eq]=${negocioId}&sort=publishedAt:desc`,
        { headers: { Authorization: `Bearer ${session.jwt}` } }
      );
      setOfertas(res.data || []);
    } catch (error) {
      console.error("Error fetching ofertas:", error);
      toast.error("Error al cargar las ofertas");
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingOferta(null);
    setTitulo("");
    setTipoOferta("Descuento");
    setDescripcion("");
    setPrecioOriginal("");
    setPrecioDescuento("");
    setPorcentajeDescuento("");
    setValidaDesde("");
    setValidaHasta("");
    setActiva(true);
    setIsModalOpen(true);
  };

  const openEditModal = (oferta: Oferta) => {
    setEditingOferta(oferta);
    setTitulo(oferta.titulo || "");
    setTipoOferta(oferta.tipo_oferta || "Descuento");
    setDescripcion(oferta.descripcion || "");
    setPrecioOriginal(oferta.precio_original || "");
    setPrecioDescuento(oferta.precio_descuento || "");
    setPorcentajeDescuento(oferta.porcentaje_descuento || "");
    setValidaDesde(oferta.valida_desde ? oferta.valida_desde.split('T')[0] : "");
    setValidaHasta(oferta.valida_hasta ? oferta.valida_hasta.split('T')[0] : "");
    setActiva(oferta.activa ?? true);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta oferta?")) return;
    
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
      const res = await fetch(`${strapiUrl}/api/ofertas/${documentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.jwt}` }
      });

      if (res.ok) {
        toast.success("Oferta eliminada");
        fetchOfertas();
      } else {
        toast.error("Error al eliminar la oferta");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) return toast.error("El título es obligatorio");
    if (!validaDesde || !validaHasta) return toast.error("Las fechas de validez son obligatorias");

    setIsSaving(true);
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
      const method = editingOferta ? "PUT" : "POST";
      const endpoint = editingOferta 
        ? `${strapiUrl}/api/ofertas/${editingOferta.documentId}`
        : `${strapiUrl}/api/ofertas`;

      const payload = {
        data: {
          titulo,
          tipo_oferta: tipoOferta,
          descripcion,
          precio_original: precioOriginal === "" ? null : Number(precioOriginal),
          precio_descuento: precioDescuento === "" ? null : Number(precioDescuento),
          porcentaje_descuento: porcentajeDescuento === "" ? null : Number(porcentajeDescuento),
          valida_desde: validaDesde ? new Date(validaDesde).toISOString() : null,
          valida_hasta: validaHasta ? new Date(validaHasta).toISOString() : null,
          activa,
          negocio: negocioId // Relation
        }
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingOferta ? "Oferta actualizada" : "Oferta creada");
        setIsModalOpen(false);
        fetchOfertas();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error?.message || "Error al guardar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-[#FFBF00]/20 rounded-[2.5rem] p-8 md:p-10 mb-12 relative overflow-hidden shadow-2xl shadow-[#FFBF00]/5">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Tag className="w-48 h-48 text-[#FFBF00]" />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Tag className="w-7 h-7 text-[#FFBF00]" />
            Mis Ofertas
          </h2>
          <p className="text-slate-400 mt-2">Gestiona las ofertas y promociones de tu negocio.</p>
        </div>
        
        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FFBF00] text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#FFBF00]/90 transition-all shadow-xl shadow-[#FFBF00]/20"
        >
          <Plus className="w-4 h-4" /> Nueva Oferta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFBF00]" />
        </div>
      ) : ofertas.length === 0 ? (
        <div className="bg-black/40 border border-white/5 rounded-3xl p-10 text-center">
          <p className="text-slate-400">No tienes ofertas activas. ¡Crea una para atraer más clientes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {ofertas.map(oferta => (
            <div key={oferta.id} className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 group hover:border-[#FFBF00]/40 transition-colors">
              <div className="flex items-start justify-between">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  {oferta.titulo}
                  {oferta.tipo_oferta && oferta.tipo_oferta !== "Descuento" && (
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black rounded-md border border-indigo-500/30">
                      {oferta.tipo_oferta === "Promocion2x1" ? "2x1" : oferta.tipo_oferta}
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(oferta)} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(oferta.documentId)} className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {oferta.descripcion && <p className="text-sm text-slate-400 line-clamp-2">{oferta.descripcion}</p>}
              
              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
                {oferta.precio_descuento && (
                  <span className="text-[#FFBF00] font-black">${oferta.precio_descuento.toLocaleString("es-AR")}</span>
                )}
                {oferta.porcentaje_descuento && (
                  <span className="px-2 py-1 bg-[#FFBF00]/20 text-[#FFBF00] rounded-lg text-xs font-bold border border-[#FFBF00]/30">
                    -{oferta.porcentaje_descuento}%
                  </span>
                )}
                <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${oferta.activa ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {oferta.activa ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {oferta.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative my-8">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {editingOferta ? "Editar Oferta" : "Nueva Oferta"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Título *</label>
                  <input 
                    type="text" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Ej: 2x1 en Pinturas"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Oferta *</label>
                  <select 
                    value={tipoOferta}
                    onChange={e => setTipoOferta(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                  >
                    <option value="Descuento">Descuento Ponderado</option>
                    <option value="Promocion2x1">2x1</option>
                    <option value="Regalo">Regalo con Compra</option>
                    <option value="Especial">Promoción Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                  <textarea 
                    value={descripcion} 
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Detalles de la oferta..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50 min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Precio Original ($)</label>
                    <input 
                      type="number" 
                      value={precioOriginal} 
                      onChange={e => setPrecioOriginal(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Precio Descuento ($)</label>
                    <input 
                      type="number" 
                      value={precioDescuento} 
                      onChange={e => setPrecioDescuento(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descuento (%)</label>
                    <input 
                      type="number" 
                      value={porcentajeDescuento} 
                      onChange={e => setPorcentajeDescuento(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Válida Desde *</label>
                    <input 
                      type="date" 
                      value={validaDesde} 
                      onChange={e => setValidaDesde(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Válida Hasta *</label>
                    <input 
                      type="date" 
                      value={validaHasta} 
                      onChange={e => setValidaHasta(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFBF00]/50"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={activa}
                    onChange={e => setActiva(e.target.checked)}
                    className="w-5 h-5 accent-[#FFBF00] cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-bold text-white">Oferta Activa</span>
                    <span className="block text-xs text-slate-400 mt-0.5">Si desactivas, la oferta no se mostrará públicamente.</span>
                  </div>
                </label>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-white bg-white/5 hover:bg-white/10 font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-[#FFBF00]/20 flex items-center justify-center"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
