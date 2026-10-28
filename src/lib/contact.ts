import { getContent } from "@/lib/content";

/**
 * Copy for the /contact page. The address, email, and X handle themselves are
 * not stored here: the page reads `location` and `socials`, the same fields the
 * footer uses, so one edit updates both.
 */
export type ContactContent = {
  /** Turns the page and its nav link on or off. */
  enabled?: boolean;
  navLabel?: string;
  page?: {
    title?: string;
    /** Shown under the title. Paragraphs separated by blank lines; supports [text](url) links. */
    intro?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  labels?: {
    connectHeading?: string;
    openMapLabel?: string;
  };
};

/** `contact` is not in the generated content.json type until it exists in Firestore. */
export function getContact(): ContactContent {
  return ((getContent() as { contact?: ContactContent }).contact ?? {}) as ContactContent;
}
