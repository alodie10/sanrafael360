import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import CrmPilotClient from "@/components/portal/crm/CrmPilotClient";

export default async function PortalCrmPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userRole = session.user?.role?.toLowerCase();
  const isAdmin =
    userRole === "admin" ||
    userRole === "super admin" ||
    ADMIN_EMAILS.includes(session.user?.email || "");

  const jwt = (session as { jwt?: string }).jwt || "";
  return <CrmPilotClient jwt={jwt} isAdmin={isAdmin} />;
}
