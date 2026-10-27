import { getContent } from "@/lib/content";
import { PublicationsClient, type PublicationsContent } from "./publications-client";

export const metadata = {
  title: "Publications — ThirdSpace | University of Toronto",
  description:
    "Book chapters, journal articles, conference proceedings, and research artifacts from the ThirdSpace research group.",
  alternates: { canonical: "/publications" },
};

export default function PublicationsPage() {
  const contentData = getContent();
  const publications = (contentData.publications ?? {}) as PublicationsContent;

  return <PublicationsClient publications={publications} />;
}
