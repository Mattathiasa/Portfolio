import { useEffect, type RefObject } from 'react';

// Several project demos are server-rendered (e.g. Express, TanStack Start) and
// go to sleep when idle, so the first visit waits on a cold start before the
// new tab shows anything. Sending a tiny HEAD request when a `data-warm` link
// scrolls into view wakes that server before the visitor clicks "Live".
// At most one request per URL per page load; skipped when Save-Data is on.
const warmed = new Set<string>();

function warmUp(url: string) {
  if (!/^https?:\/\//i.test(url) || warmed.has(url)) return;
  warmed.add(url);
  fetch(url, { method: 'HEAD', mode: 'no-cors', credentials: 'omit', cache: 'no-store' }).catch(() => {});
}

export function useWarmLinks(containerRef: RefObject<HTMLElement>, deps: unknown) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          warmUp((entry.target as HTMLAnchorElement).href);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '300px 0px' },
    );
    container.querySelectorAll<HTMLAnchorElement>('a[data-warm]').forEach((a) => io.observe(a));
    return () => io.disconnect();
  }, [containerRef, deps]);
}
