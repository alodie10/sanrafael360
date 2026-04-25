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

  // Fetch business data
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  const isAdmin = session.user?.role === 'Admin';
  
  let negocio = null;

  if (isAdmin) {
    // Si es admin, buscamos de forma global por slug
    const res = await fetch(`${strapiUrl}/api/negocios?filters[slug][$eq]=${slug}&populate=*`, {
      headers: { "Authorization": `Bearer ${session.jwt}` },
      cache: "no-store"
    });
    if (res.ok) {
      const { data } = await res.json();
      negocio = data?.[0];
    }
  } else {
    // Si no es admin, buscamos solo entre sus negocios
    const res = await fetch(`${strapiUrl}/api/negocios/me`, {
      headers: { "Authorization": `Bearer ${session.jwt}` },
      cache: "no-store"
    });
    if (res.ok) {
      const { data: negocios } = await res.json();
      negocio = negocios.find((n: any) => n.slug === slug);
    }
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
