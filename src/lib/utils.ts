import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Prepend the basePath to the given path in production to ensure correct resolution on GitHub Pages.
 */
export function getAssetPath(path: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const repoName = "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (isProd && repoName) {
    return `/${repoName}${normalizedPath}`;
  }
  return normalizedPath;
}

export function getImageUrl(path: string): string {
  // Full web addresses (e.g. a news item's image taken from its source page) are
  // used as-is; only uploaded paths are prefixed with the ImageKit endpoint.
  if (/^https?:\/\//i.test(path)) return path;
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${endpoint}${normalizedPath}`;
}
