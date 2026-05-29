import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/dashboard/", "/admin/", "/api/"],
    },
    sitemap: "https://www.sanrafael360.com/sitemap.xml",
  };
}
