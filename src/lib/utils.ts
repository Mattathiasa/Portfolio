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

// True for empty values (links are optional), in-site paths/anchors, and
// http(s) URLs with a real-looking host. Scheme-less input is checked as it
// will be stored, i.e. after toExternalUrl, so "gurshapodcast.vercel.app" passes
// while "htps://x.com" or "my site" do not.
export function isValidLink(url: string | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed || /^[/#]/.test(trimmed)) return true;
  if (/\s/.test(trimmed)) return false;
  try {
    const { protocol, hostname } = new URL(toExternalUrl(trimmed));
    return (protocol === 'https:' || protocol === 'http:') && (hostname.includes('.') || hostname === 'localhost');
  } catch {
    return false;
  }
}
