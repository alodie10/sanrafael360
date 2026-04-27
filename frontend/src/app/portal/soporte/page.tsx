import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  LifeBuoy, 
  ArrowLeft,
  Mail,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import SupportForm from "@/components/portal/SupportForm";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-primary/30 pt-24 pb-20">
      {/* Header Premium */}
      <div className="bg-zinc-950/50 border-b border-white/5 backdrop-blur-xl sticky top-[72px] z-40">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link 
            href="/portal" 
            className="group flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-6 text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Portal
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20">
              <LifeBuoy className="w-8 h-8 text-black animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold text-white tracking-tight italic">Centro de Soporte</h1>
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Asistencia para Propietarios • San Rafael 360</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar de Ayuda */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <HelpCircle className="w-8 h-8 text-primary/40 mb-6" />
              <h3 className="text-xl font-serif font-bold text-white mb-4 italic">¿Cómo funciona?</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Nuestro equipo de administración revisa cada caso manualmente. Recibirás una respuesta por correo electrónico y podrás verla aquí mismo una vez procesada.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Tiempo de respuesta: 24-48hs
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Atención de Lunes a Viernes
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-6">Otros canales</h3>
              <div className="space-y-4">
                <a 
                  href="mailto:soporte@sanrafael360.com" 
                  className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <Mail className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-bold text-white">Email Corporativo</span>
                </a>
                <a 
                  href={`https://wa.me/5492604000000?text=${encodeURIComponent("Hola! Necesito soporte técnico con mi cuenta de San Rafael 360.")}`} 
                  className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <MessageCircle className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-bold text-white">WhatsApp Directo</span>
                </a>
              </div>
            </div>
          </div>

          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/20 border border-white/5 p-10 rounded-[3rem] backdrop-blur-sm relative">
               <div className="absolute top-10 right-10 opacity-10">
                 <LifeBuoy className="w-32 h-32 text-white" />
               </div>
               <div className="relative z-10">
                 <h2 className="text-3xl font-serif font-bold text-white mb-2 italic">Envíanos tu consulta</h2>
                 <p className="text-zinc-500 mb-10">Describe tu problema o solicitud de cambio con el mayor detalle posible.</p>
                 <SupportForm 
                   jwt={session.jwt as string} 
                   userEmail={session.user?.email || undefined}
                   userName={session.user?.name || undefined}
                 />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
