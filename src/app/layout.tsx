import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SectionObserver } from "@/components/section-observer";
import { ScrollProgress } from "@/components/scroll-progress";
import { getContent } from "@/lib/content";
import { getImageUrl } from "@/lib/utils";
import "./globals.css";

const content = getContent();

// Link previews use the home page's hero photo, so changing it in admin
// changes the preview too. ImageKit crops it to the 1200×630 size social
// sites expect and serves a JPEG, since some sites don't accept WebP.
const ogImage = content.hero?.groupPhotoPath
  ? {
      url: `${getImageUrl(content.hero.groupPhotoPath)}?tr=w-1200,h-630,fo-auto,f-jpg`,
      width: 1200,
      height: 630,
      alt: content.hero.groupPhotoAlt ?? "",
    }
  : undefined;

export const metadata: Metadata = {
  metadataBase: new URL("https://thirdspace-uoft.github.io"),
  title: content.layout.pageTitle,
  description: content.layout.pageDescription,
  // Only the image is set here: each page's own title and description are
  // what link previews fall back to, so shares of /news say "News", not the
  // home page title.
  openGraph: {
    type: "website",
    images: ogImage ? [ogImage] : undefined,
  },
  twitter: {
    card: "summary_large_image",
    images: ogImage ? [ogImage] : undefined,
  },
  icons: {
    icon: "/square_logo.webp",
    shortcut: "/square_logo.webp",
    apple: "/square_logo.webp",
  },
};

export const viewport = {
  colorScheme: "light",
  themeColor: "#B21F2D",
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
