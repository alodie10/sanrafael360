"use client";

import { useRouter } from "next/navigation";
import NavigationFAB from "@/components/layout/NavigationFAB";

export default function EfemerideBackButton() {
  const router = useRouter();
  return <NavigationFAB isVisible type="back" onClick={() => router.back()} />;
}
