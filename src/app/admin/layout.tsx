import type { Metadata } from "next";

// The admin page is a client component and can't export metadata itself.
// It is part of the public export, so tell search engines to stay out.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
