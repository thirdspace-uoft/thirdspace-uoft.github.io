import { getContent } from "@/lib/content";
import { getImageUrl } from "@/lib/utils";

/**
 * The site's public address. Canonical URLs and share links are built from
 * it, so moving to another domain is a one-line change here.
 */
export const SITE_URL = "https://thirdspace-uoft.github.io";

/** "/blog/x" → "https://thirdspace-uoft.github.io/blog/x" */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Social sites want 1200×630 JPEG or PNG (some reject WebP). ImageKit crops
 * and converts any uploaded image to that on the fly.
 */
export function shareImageUrl(url: string): string {
  return `${url}?tr=w-1200,h-630,fo-auto,f-jpg`;
}

/**
 * Link previews fall back to the home page's hero photo, so changing it in
 * admin changes the preview too.
 */
export function defaultShareImage() {
  const { hero } = getContent();
  if (!hero?.groupPhotoPath) return undefined;
  return {
    url: shareImageUrl(getImageUrl(hero.groupPhotoPath)),
    width: 1200,
    height: 630,
    alt: hero.groupPhotoAlt ?? "",
  };
}
