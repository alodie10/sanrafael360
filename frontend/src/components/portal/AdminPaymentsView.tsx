"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Search,
  ChevronRight
} from "lucide-react";
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
        
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
          headers: { Authorization: `Bearer ${jwt}` }
        });
        const json = await res.json();
        console.log(`DEBUG: Strapi devolvió ${json.data?.length || 0} negocios de un total de ${json.meta?.pagination?.total || 0}`);
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
  }, [jwt, searchTerm, filterType]);

  // Ya no filtramos localmente, usamos la data que viene del server
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
    total: data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'aprobado').reduce((sum: number, p: any) => sum + p.monto, 0) || 0), 0),
    active: data.filter(n => {
      const validUntil = n.premium_valid_until ? new Date(n.premium_valid_until) : null;
      return n.is_premium && (!validUntil || validUntil > new Date());
    }).length,
    pending: data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'pendiente').length || 0), 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">Total Recaudado</p>
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
                  <tr key={negocio.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${negocio.owner ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-800 border-white/5 text-slate-600'}`}>
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`text-sm font-bold transition-colors ${negocio.owner ? 'text-white group-hover:text-primary' : 'text-slate-500'}`}>
                            {negocio.owner?.email || ((negocio.is_premium && !isExpired) ? "Gestionado por San Rafael 360" : "Sin dueño asignado")}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{negocio.nombre}</div>
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
    </div>
  );
}
