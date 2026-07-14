import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import EditBusinessForm from "@/components/portal/EditBusinessForm";
import Link from "next/link";
import { getStrapiUrl } from "@/lib/strapi";

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBusinessPage(props: any) {
  // Soporte universal para Next.js 14 y 15
  const params = await props.params;
  const slug = params?.slug;
  const session: any = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const strapiUrl = getStrapiUrl();
  const userEmail = session.user?.email;
  const isAdmin = session.user?.role?.toLowerCase() === 'admin' || ADMIN_EMAILS.includes(userEmail?.toLowerCase() || "");
  
  let negocio = null;
  let fetchError = null;

  try {
    // REGLA ORO: En Strapi 5, siempre usamos populate para que el formulario tenga los datos
    const populateParams = "populate[0]=logo&populate[1]=imagen_portada&populate[2]=galeria&populate[3]=schedules&populate[4]=categoria&populate[5]=owner&populate[6]=atributos&populate[7]=ofertas";
    
    // Si es admin, buscamos global. Si no, usamos /me para seguridad
    const endpoint = isAdmin 
      ? `${strapiUrl}/api/negocios?filters[slug][$eq]=${slug}&${populateParams}`
      : `${strapiUrl}/api/negocios/me`;

    const res = await fetch(endpoint, {
      headers: { "Authorization": `Bearer ${session.jwt}` },
      cache: "no-store"
    });

    if (res.ok) {
      const body = await res.json();
      const rawData = body.data;
      
      if (isAdmin) {
        // La búsqueda por filtros siempre devuelve un array
        negocio = Array.isArray(rawData) ? rawData[0] : rawData;
      } else {
        // /api/negocios/me devuelve la lista del usuario
        negocio = Array.isArray(rawData) ? rawData.find((n: any) => n.slug === slug) : null;
      }
    } else {
      fetchError = `Error de API: ${res.status}`;
    }
  } catch (err: any) {
    fetchError = err.message;
    console.error("❌ Error crítico en EditBusinessPage:", err);
  }

  // Si no hay negocio después de todos los intentos
  if (!negocio) {
    return (
      <main className="min-h-screen pt-40 px-4 text-center bg-black">
        <div className="max-w-md mx-auto p-8 bg-zinc-900/50 border border-white/10 rounded-[2.5rem]">
          <h1 className="text-2xl font-bold text-white mb-4">No se pudo cargar el negocio</h1>
          <p className="text-zinc-400 mb-8">
            {fetchError ? `Detalle técnico: ${fetchError}` : `No tienes permisos para editar "${slug}" o el negocio no existe.`}
          </p>
          <Link href="/portal" className="inline-flex px-8 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl text-xs">
            Volver al Portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <EditBusinessForm negocio={negocio} session={session} />
    </main>
  );
}
