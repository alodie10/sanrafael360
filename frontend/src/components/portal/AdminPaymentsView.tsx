"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Search,
  ChevronRight,
  Plus, X, Trash2, History
} from "lucide-react";
import { getStrapiUrl } from "@/lib/strapi";
// Formateo nativo para evitar dependencias extra
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

import { useMemo } from "react";

interface AdminPaymentsViewProps {
  jwt: string;
}

export default function AdminPaymentsView({ jwt }: AdminPaymentsViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'expired' | 'expiring'>('premium');
  // Filtro de mes para recaudación: formato "YYYY-MM" o "" para todo
  const [revenueMonth, setRevenueMonth] = useState("");

  // Genera las últimas 12 opciones mes/año para el selector
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  }, []);

  // Estados para Modal de Pagos
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extendMonths, setExtendMonths] = useState(1);
  const [manualDate, setManualDate] = useState("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  useEffect(() => {
    if (selectedBusiness && selectedBusiness.premium_valid_until) {
      setManualDate(selectedBusiness.premium_valid_until.split('T')[0]);
    } else {
      setManualDate("");
    }
  }, [selectedBusiness?.id]);
  
  // Mantener el negocio seleccionado actualizado tras recargar la data
  useEffect(() => {
    if (selectedBusiness) {
      const updated = data.find(b => b.id === selectedBusiness.id);
      if (updated) {
        setSelectedBusiness(updated);
        if (updated.premium_valid_until) {
          setManualDate(updated.premium_valid_until.split('T')[0]);
        } else {
          setManualDate("");
        }
      }
    }
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const strapiUrl = getStrapiUrl();
        
        // Construimos la URL con filtros de servidor para que busque en TODA la base
        // Construimos la URL con filtros de servidor para que busque en TODA la base
        let query = `/api/negocios?populate[owner]=true&populate[pagos]=true&pagination[pageSize]=1000`;
        
        // Búsqueda simplificada para evitar Error 500 en Strapi 5
        if (searchTerm) {
          query += `&filters[nombre][$containsi]=${encodeURIComponent(searchTerm)}`;
        }

        // Filtros de estado en servidor
        const now = new Date();
        const nowISO = now.toISOString();
        const nextWeekISO = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        if (filterType === 'premium') {
          query += `&filters[is_premium][$eq]=true&filters[premium_valid_until][$gt]=${nowISO}`;
        } else if (filterType === 'expired') {
          query += `&filters[premium_valid_until][$lt]=${nowISO}`;
        } else if (filterType === 'expiring') {
          // Vencen entre hoy y dentro de 7 días
          query += `&filters[premium_valid_until][$gt]=${nowISO}&filters[premium_valid_until][$lt]=${nextWeekISO}`;
        }

        const res = await fetch(`${strapiUrl}${query}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: 'no-store'
        });
        const json = await res.json();
        console.log(`DEBUG: Strapi devolvió ${json.data?.length || 0} negocios`);
        if (selectedBusiness) {
          const check = json.data.find((b: any) => b.id === selectedBusiness.id);
          console.log("DEBUG: Refresh fetched selected business pagos:", check?.pagos?.length || (check?.pagos?.data?.length || 0));
        }
        setData(json.data || []);
      } catch (err) {
        console.error("Error fetching admin payments data:", err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce simple para no saturar el servidor mientras escribís
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [jwt, searchTerm, filterType, refreshTrigger]);

  // Ya no filtramos localmente, usamos la data que viene del server

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !selectedBusiness) return;
    
    setIsSubmitting(true);
    try {
      const strapiUrl = getStrapiUrl();
      
      // 1. Crear el pago
      const pagoData = {
        monto: Number(amount),
        estado: 'aprobado',
        fecha_pago: new Date().toISOString(),
        external_reference: notes,
        negocio: selectedBusiness.documentId,
        extendMonths: extendMonths
      };
      
      const res = await fetch(`${strapiUrl}/api/negocios/admin/pagos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}` 
        },
        body: JSON.stringify(pagoData)
      });
      
      if (!res.ok) throw new Error("Error creando pago custom");

      setAmount("");
      setNotes("");
      setExtendMonths(1);
      setRefreshTrigger(prev => prev + 1);
      
      // Optimistic update para que se vea inmediato en pantalla
      setSelectedBusiness((prev: any) => {
        if (!prev) return prev;
        const currentPagos = Array.isArray(prev.pagos) ? [...prev.pagos] : [...(prev.pagos?.data || [])];
        return {
          ...prev,
          pagos: [
            { ...pagoData, id: 'temp_' + Date.now(), documentId: 'temp_' + Date.now(), createdAt: new Date().toISOString() },
            ...currentPagos
          ]
        };
      });
    } catch (err) {
      console.error("Error agregando pago:", err);
      alert("Error al guardar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdateValidity = async () => {
    if (!selectedBusiness) return;
    setIsUpdatingDate(true);
    try {
      const strapiUrl = getStrapiUrl();
      const res = await fetch(`${strapiUrl}/api/negocios/admin/vigencia/${selectedBusiness.documentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}` 
        },
        body: JSON.stringify({ premium_valid_until: manualDate || null })
      });
      if (!res.ok) throw new Error("Error al guardar la vigencia: " + await res.text());
      const responseBody = await res.json();
      console.log("VIGENCIA UPDATE RESPONSE:", responseBody);
      setRefreshTrigger(prev => prev + 1);
      alert("Guardado OK! Vuelve a recargar si la fecha salta.");
    } catch (err) {
      console.error(err);
      alert("Error crítico al actualizar: " + (err as Error).message);
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleDeletePayment = async (documentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pago?")) return;
    
    try {
      const strapiUrl = getStrapiUrl();
      const res = await fetch(`${strapiUrl}/api/negocios/admin/pagos/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error("Error eliminando pago");
      
      // Actualización optimista para borrar de la UI instantáneamente
      setSelectedBusiness((prev: any) => {
        if (!prev) return prev;
        const currentPagos = Array.isArray(prev.pagos) ? prev.pagos : (prev.pagos?.data || []);
        return {
          ...prev,
          pagos: currentPagos.filter((p: any) => (p.documentId || p.id) !== documentId)
        };
      });

      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error eliminando pago:", err);
      alert("Error al eliminar el pago");
    }
  };

  const processedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aPagos = a.pagos || a.attributes?.pagos;
      const bPagos = b.pagos || b.attributes?.pagos;

      // Dependiendo de si viene con .data o es array directo (Strapi 4 vs 5)
      const aPagosArray = Array.isArray(aPagos) ? aPagos : (aPagos?.data || []);
      const bPagosArray = Array.isArray(bPagos) ? bPagos : (bPagos?.data || []);

      const aHasPayments = aPagosArray.length > 0;
      const bHasPayments = bPagosArray.length > 0;

      const aPremium = a.is_premium || a.attributes?.is_premium;
      const bPremium = b.is_premium || b.attributes?.is_premium;

      const aOwner = a.owner || a.attributes?.owner;
      const bOwner = b.owner || b.attributes?.owner;

      // 1. Priorizar negocios con pagos registrados
      if (aHasPayments && !bHasPayments) return -1;
      if (!aHasPayments && bHasPayments) return 1;

      // 2. Luego, priorizar negocios activos (premium)
      if (aPremium && !bPremium) return -1;
      if (!aPremium && bPremium) return 1;

      // 3. Finalmente, priorizar los que tienen dueño asignado
      if (aOwner && !bOwner) return -1;
      if (!aOwner && bOwner) return 1;
      
      return 0;
    });

    console.log("DEBUG SORTING:", sorted.map(n => ({ 
      nombre: n.nombre || n.attributes?.nombre, 
      pagos: Array.isArray(n.pagos) ? n.pagos.length : n.pagos?.data?.length,
      hasPayments: (Array.isArray(n.pagos) ? n.pagos : (n.pagos?.data || [])).length > 0
    })));

    return sorted;
  }, [data]);

  const stats = {
    total: data.reduce((acc, curr) => {
      const pagosAprobados = curr.pagos?.filter((p: any) => {
        if (p.estado !== 'aprobado') return false;
        // Si hay filtro de mes, comparar la fecha del pago
        if (revenueMonth) {
          const pagoDate = new Date(p.createdAt || p.fecha_pago || p.updatedAt);
          const pagoYYYYMM = `${pagoDate.getFullYear()}-${String(pagoDate.getMonth() + 1).padStart(2, '0')}`;
          return pagoYYYYMM === revenueMonth;
        }
        return true;
      }) || [];
      return acc + pagosAprobados.reduce((sum: number, p: any) => sum + p.monto, 0);
    }, 0),
    active: data.filter(n => {
      const validUntil = n.premium_valid_until ? new Date(n.premium_valid_until) : null;
      return n.is_premium && (!validUntil || validUntil > new Date());
    }).length,
    pending: data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'pendiente').length || 0), 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Filtro de Mes para Recaudación */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Filtro de Recaudación</h3>
          <p className="text-sm text-zinc-400">Filtrá el total recaudado por mes para ver el ingreso de cada período.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400 whitespace-nowrap">Mes:</label>
            <select
              value={revenueMonth}
              onChange={(e) => setRevenueMonth(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark] min-w-[180px]"
            >
              <option value="">— Todo el historial —</option>
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {revenueMonth && (
            <button
              onClick={() => setRevenueMonth("")}
              className="text-sm text-primary hover:text-white transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {loading && (
          <div className="absolute -top-4 left-0 right-0 h-1 bg-primary/20 overflow-hidden rounded-full">
            <div className="h-full bg-primary animate-progress-buffer w-1/3 rounded-full" />
          </div>
        )}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                {revenueMonth
                  ? `Recaudado en ${monthOptions.find(o => o.value === revenueMonth)?.label || revenueMonth}`
                  : 'Total Recaudado (histórico)'}
              </p>
              <h3 className="text-2xl font-black text-white">$ {stats.total.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl group hover:border-green-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">Socios Elite Activos</p>
              <h3 className="text-2xl font-black text-white">{stats.active}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl group hover:border-orange-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl group-hover:bg-orange-500/20 transition-colors">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">Pagos Pendientes</p>
              <h3 className="text-2xl font-black text-white">{stats.pending}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar con Buscador y Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/30 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por negocio o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-14 pr-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all"
          />
          {searchTerm && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest bg-black/60 px-2 py-1 rounded-md">
              {processedData.length} resultados
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
          <button 
            onClick={() => setFilterType('premium')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'premium' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >Activos</button>
          <button 
            onClick={() => setFilterType('expiring')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'expiring' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:text-white'}`}
          >Por Vencer</button>
          <button 
            onClick={() => setFilterType('expired')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'expired' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white'}`}
          >Vencidos</button>
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >Todos</button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Usuario / Negocio</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fechas</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Suscripción Premium</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Último Pago</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedData.length > 0 ? processedData.map((negocio) => {
                const ultimoPago = negocio.pagos?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                const totalAbonado = negocio.pagos?.filter((p: any) => p.estado === 'aprobado').reduce((sum: number, p: any) => sum + p.monto, 0) || 0;
                
                const now = new Date();
                const validUntil = negocio.premium_valid_until ? new Date(negocio.premium_valid_until) : null;
                const isExpired = negocio.is_premium && validUntil && validUntil < now;
                const isExpiringSoon = negocio.is_premium && validUntil && 
                                      (validUntil.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000) && 
                                      validUntil > now;

                return (
                  <tr key={negocio.id} onClick={() => setSelectedBusiness(negocio)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${negocio.owner ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-800 border-white/5 text-slate-600'}`}>
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                            {negocio.nombre}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                            {negocio.owner?.email || ((negocio.is_premium && !isExpired) ? "Gestionado por SR360" : "Sin dueño asignado")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDate(negocio.createdAt)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          In: {negocio.owner?.updatedAt ? formatDate(negocio.owner.updatedAt) : '---'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {negocio.is_premium ? (
                        <div className={`rounded-2xl p-3 inline-block border transition-all ${isExpired ? 'bg-red-500/5 border-red-500/20' : isExpiringSoon ? 'bg-orange-500/5 border-orange-500/20' : 'bg-primary/5 border-primary/20'}`}>
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-primary'}`}>
                            {isExpired ? 'Expirado' : isExpiringSoon ? 'Vence pronto' : 'Activo'}
                          </div>
                          <div className="text-xs text-white">
                            {negocio.premium_valid_until ? formatDate(negocio.premium_valid_until) : 'Sin fecha'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 font-medium italic">Sin suscripción</div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-white">$ {totalAbonado.toLocaleString()}</div>
                        {ultimoPago && (
                          <div className="text-[10px] text-slate-500">
                            ID: {ultimoPago.mp_payment_id?.slice(-6) || 'Man'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className={`
                        inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                        ${isExpired ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                          isExpiringSoon ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          negocio.is_premium ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          'bg-slate-800 text-slate-500 border-white/5'}
                      `}>
                        {isExpired ? 'Vencido' : isExpiringSoon ? 'Elite (Alerta)' : negocio.is_premium ? 'Elite' : 'Básico'}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-serif italic text-lg">
                    No se encontraron negocios con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagos */}
      {selectedBusiness && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
                              {pago.external_reference && ` • ${pago.external_reference}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded border border-green-500/20">
                            {pago.estado || 'aprobado'}
                          </span>
                          <button 
                            onClick={() => handleDeletePayment(pago.documentId || pago.id)}
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
      , document.body)}
    </div>
  );
}
