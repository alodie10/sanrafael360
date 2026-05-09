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

interface AdminPaymentsViewProps {
  session: any;
}

export default function AdminPaymentsView({ session }: AdminPaymentsViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
        // Buscamos negocios con sus dueños y pagos
        const res = await fetch(`${strapiUrl}/api/negocios?populate[owner]=true&populate[pagos]=true&sort=createdAt:desc`, {
          headers: { Authorization: `Bearer ${session.jwt}` }
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
  }, [session.jwt]);

  const filteredData = data.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 animate-pulse">Cargando tablero financiero...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Recaudado</p>
              <h3 className="text-2xl font-black text-white">$ {data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'aprobado').reduce((sum: number, p: any) => sum + p.monto, 0) || 0), 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Socios Elite Activos</p>
              <h3 className="text-2xl font-black text-white">{data.filter(n => n.is_premium).length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Pagos Pendientes</p>
              <h3 className="text-2xl font-black text-white">{data.reduce((acc, curr) => acc + (curr.pagos?.filter((p: any) => p.estado === 'pendiente').length || 0), 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input 
          type="text"
          placeholder="Buscar por negocio o email del dueño..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/40 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all backdrop-blur-md"
        />
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usuario / Negocio</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fechas</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Suscripción Premium</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Último Pago</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.map((negocio) => {
                const ultimoPago = negocio.pagos?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                const totalAbonado = negocio.pagos?.filter((p: any) => p.estado === 'aprobado').reduce((sum: number, p: any) => sum + p.monto, 0) || 0;
                
                return (
                  <tr key={negocio.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center text-primary">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{negocio.owner?.email || "Sin dueño"}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{negocio.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Creado: {format(new Date(negocio.createdAt), 'dd MMM yy', { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          Last Login: {negocio.owner?.updatedAt ? format(new Date(negocio.owner.updatedAt), 'dd/MM HH:mm') : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {negocio.is_premium ? (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 inline-block">
                          <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Activo</div>
                          <div className="text-xs text-white">
                            {negocio.premium_since ? format(new Date(negocio.premium_since), 'dd/MM/yy') : '---'} al {negocio.premium_valid_until ? format(new Date(negocio.premium_valid_until), 'dd/MM/yy') : '---'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 font-medium italic">Sin suscripción activa</div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-white">$ {totalAbonado.toLocaleString()}</div>
                        {ultimoPago && (
                          <div className="text-[10px] text-slate-500">
                            Último: {format(new Date(ultimoPago.createdAt), 'dd/MM/yy')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`
                        inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${negocio.is_premium ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}
                      `}>
                        {negocio.is_premium ? 'Elite' : 'Básico'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
