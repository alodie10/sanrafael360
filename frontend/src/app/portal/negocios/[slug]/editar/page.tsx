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

  // Fetch business data specifically for the owner
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  const res = await fetch(`${strapiUrl}/api/negocios/me`, {
    headers: {
      "Authorization": `Bearer ${session.jwt}`
    },
    cache: "no-store"
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Error al cargar datos</h1>
        <p className="text-slate-400">No pudimos verificar la propiedad de este negocio.</p>
      </div>
    );
  }

  const { data: negocios } = await res.json();
  const negocio = negocios.find((n: any) => n.slug === slug);

  if (!negocio) {
    redirect("/portal");
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <EditBusinessForm negocio={negocio} session={session} />
    </main>
  );
}
