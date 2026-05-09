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
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useMemo } from "react";

interface AdminPaymentsViewProps {
  jwt: string;
}

export default function AdminPaymentsView({ jwt }: AdminPaymentsViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'expired' | 'expiring'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
        // Buscamos negocios con sus dueños y pagos - Aumentamos el límite para ver todos
        const res = await fetch(`${strapiUrl}/api/negocios?populate[owner]=true&populate[pagos]=true&pagination[limit]=1000`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error("Error fetching admin payments data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jwt]);

  // Lógica de filtrado y ordenamiento avanzada
  const processedData = useMemo(() => {
    let filtered = data.filter(item => {
      const name = item.nombre || "";
      const email = item.owner?.email || "";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const now = new Date();
      const validUntil = item.premium_valid_until ? new Date(item.premium_valid_until) : null;
      const isExpired = item.is_premium && validUntil && validUntil < now;
      const isExpiringSoon = item.is_premium && validUntil && 
                             (validUntil.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000) && 
                             validUntil > now;

      if (filterType === 'premium') return item.is_premium && !isExpired;
      if (filterType === 'expired') return isExpired;
      if (filterType === 'expiring') return isExpiringSoon;
      
      return true;
    });

    // Ordenamiento Prioritario:
    // 1. Dueño + Premium Activo
    // 2. Dueño Básico
    // 3. Resto (Directorio sin dueño)
    return filtered.sort((a, b) => {
      // Prioridad 1: Tiene dueño vs No tiene dueño
      if (a.owner && !b.owner) return -1;
      if (!a.owner && b.owner) return 1;
      
      // Prioridad 2: Dentro de los que tienen dueño, Premium primero
      if (a.owner && b.owner) {
        if (a.is_premium && !b.is_premium) return -1;
        if (!a.is_premium && b.is_premium) return 1;
      }

      // Prioridad 3: Orden alfabético o por fecha de creación
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data, searchTerm, filterType]);

  const stats = {
    total: data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'aprobado').reduce((sum: number, p: any) => sum + p.monto, 0) || 0), 0),
    active: data.filter(n => {
      const validUntil = n.premium_valid_until ? new Date(n.premium_valid_until) : null;
      return n.is_premium && (!validUntil || validUntil > new Date());
    }).length,
    pending: data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'pendiente').length || 0), 0)
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 animate-pulse font-serif italic">Analizando base de suscriptores...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        <div className="flex items-center gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >Todos</button>
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
                            {negocio.owner?.email || "Sin dueño asignado"}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{negocio.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {format(new Date(negocio.createdAt), 'dd MMM yy', { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          In: {negocio.owner?.updatedAt ? format(new Date(negocio.owner.updatedAt), 'dd/MM HH:mm') : '---'}
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
                            {negocio.premium_valid_until ? format(new Date(negocio.premium_valid_until), 'dd/MM/yy') : 'Sin fecha'}
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
