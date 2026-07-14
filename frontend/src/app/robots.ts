import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/dashboard/", "/admin/", "/api/", "/olvide-password", "/restablecer-password"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
