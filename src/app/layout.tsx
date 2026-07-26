import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SectionObserver } from "@/components/section-observer";
import { ScrollProgress } from "@/components/scroll-progress";
import contentData from "../../public/config/content.json";
import "./globals.css";

export const metadata: Metadata = {
  title: contentData.layout.pageTitle,
  description: contentData.layout.pageDescription,
};

export const viewport = {
  colorScheme: "light",
  themeColor: "#1E3765",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
