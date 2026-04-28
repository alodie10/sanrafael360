import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Verify path
import { notFound, redirect } from "next/navigation";
import EditBusinessForm from "@/components/portal/EditBusinessForm";

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBusinessPage({ params }: EditPageProps) {
  const { slug } = await params;
  const session: any = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch business data using Document Service style
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
  const isAdmin = session.user?.role === 'Admin' || session.user?.email === 'diegocristianalonso@gmail.com';
  
  let negocio = null;

  try {
    // Intentamos buscar el negocio primero de forma global (Admin/Owner)
    const res = await fetch(`${strapiUrl}/api/negocios?filters[slug][$eq]=${slug}&populate[0]=logo&populate[1]=imagen_portada&populate[2]=galeria&populate[3]=schedules&populate[4]=categoria`, {
      headers: { "Authorization": `Bearer ${session.jwt}` },
      cache: "no-store"
    });
    
    if (res.ok) {
      const body = await res.json();
      const data = body.data;
      // Strapi 5 devuelve array en filtros de colecciones
      negocio = Array.isArray(data) ? data[0] : data;
    }

    // Si no lo encontró por slug global, probamos con /me (para dueños)
    if (!negocio && !isAdmin) {
      const resMe = await fetch(`${strapiUrl}/api/negocios/me`, {
        headers: { "Authorization": `Bearer ${session.jwt}` },
        cache: "no-store"
      });
      if (resMe.ok) {
        const { data: negocios } = await resMe.json();
        negocio = negocios.find((n: any) => n.slug === slug);
      }
    }
  } catch (err) {
    console.error("Error fetching business for edit:", err);
  }

  if (!negocio) {
    redirect("/portal");
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <EditBusinessForm negocio={negocio} session={session} />
    </main>
  );
}
