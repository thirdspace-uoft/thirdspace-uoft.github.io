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
  const repoName = "thirdspace.toronto.edu";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return isProd ? `/${repoName}${normalizedPath}` : normalizedPath;
}
