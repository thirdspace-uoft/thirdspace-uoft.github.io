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
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/6lrshzb1q";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${endpoint}${normalizedPath}`;
}
