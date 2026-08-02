import { getServerSession } from "next-auth/next";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboardContainer from "@/components/portal/AdminDashboardContainer";
import { getStrapiUrl } from "@/lib/strapi";

async function getPendingClaims(jwt: string) {
  try {
    const strapiUrl = getStrapiUrl();
    const res = await fetch(`${strapiUrl}/api/negocios/admin/pending-claims`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error(`[Admin] Error fetching claims: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("[Admin] Network error fetching claims:", error);
    return [];
  }
}


export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Whitelist de Admins
  const userRole = session.user?.role?.toLowerCase();
  const isAuthorized = userRole === 'admin' || userRole === 'super admin' || ADMIN_EMAILS.includes(session.user?.email || "");

  if (!isAuthorized) {
    redirect("/portal");
  }

  const claims = await getPendingClaims(session.jwt as string);

  return (
    <AdminDashboardContainer
      session={session}
      initialClaims={claims}
    />
  );
}
