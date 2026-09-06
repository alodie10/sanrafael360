import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export function noIndexPage(
  path: string,
  title: string,
  description?: string
): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: `${getSiteUrl()}${path}` },
    robots: { index: false, follow: false },
  };
}

export function canonicalPage(
  path: string,
  title: string,
  description: string
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${getSiteUrl()}${path}` },
  };
}
