import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  ExternalLink,
  PlusCircle,
  LayoutDashboard,
  AlertCircle
} from "lucide-react";
import AdminClaimCard from "@/components/portal/AdminClaimCard";
import Link from "next/link";

async function getPendingClaims(jwt: string) {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
  const res = await fetch(`${strapiUrl}/api/negocios/admin/pending-claims`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Whitelist de Admins
  const userRole = (session as any).user?.role?.toLowerCase();
  const isAuthorized = userRole === 'admin' || userRole === 'super admin' || session.user?.email === 'diegocristianalonso@gmail.com';

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
