import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Links typed into the admin panel without a scheme ("gurshapodcast.vercel.app")
// are resolved by the browser as paths on this site. Prefix https:// unless the
// value already has a scheme (https:, mailto:, …) or is an in-site path/anchor.
// Empty/undefined values pass through untouched so `??` fallbacks still apply.
export function toExternalUrl<T extends string | undefined>(url: T): T {
  const trimmed = url?.trim();
  if (!trimmed || /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) || /^(mailto|tel):/i.test(trimmed) || /^[/#?]/.test(trimmed)) {
    return url;
  }
  return `https://${trimmed}` as T;
}
