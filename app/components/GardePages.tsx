"use client";

import { usePathname } from "next/navigation";
import { useRole } from "@/app/lib/roles";
import AccesReserve from "./AccesReserve";

const ROUTES_ADMIN = ["/exports", "/journal", "/import", "/parametres"];

export default function GardePages({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useRole();
  const restreint = ROUTES_ADMIN.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (restreint && role && role !== "administrateur") return <AccesReserve />;
  return <>{children}</>;
}