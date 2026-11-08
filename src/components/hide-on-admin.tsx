"use client";

import { usePathname } from "next/navigation";

/**
 * Renders its children everywhere except /admin. The admin is a full-height
 * workspace, and the site footer under it broke its layout (issue #4).
 * /admin is prerendered at its own path, so the footer is absent from the
 * exported HTML too, with no flash on load.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
