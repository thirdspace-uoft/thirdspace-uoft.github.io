import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SectionObserver } from "@/components/section-observer";
import { ScrollProgress } from "@/components/scroll-progress";
import { getContent } from "@/lib/content";
import "./globals.css";

const content = getContent();

export const metadata: Metadata = {
  title: content.layout.pageTitle,
  description: content.layout.pageDescription,
};

export const viewport = {
  colorScheme: "light",
  themeColor: "#1E3765",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SectionObserver>
          <Navbar />
          <ScrollProgress />
          <div className="flex-1">{children}</div>
          <Footer />
        </SectionObserver>
      </body>
    </html>
  );
}
