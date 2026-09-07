import { useQuery } from '@tanstack/react-query';
import { getContent } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTENT } from '@/data/defaults';
import type { PortfolioContent } from '@/types/portfolio';

/**
 * Shared `content/main` reader: Firestore value with DEFAULT_CONTENT fallback.
 * `c('key')` returns the saved string when present, otherwise the default.
 */
export function useContent() {
  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  function c<K extends keyof PortfolioContent>(key: K): NonNullable<PortfolioContent[K]> {
    const value = content?.[key];
    const fallback = DEFAULT_CONTENT[key as keyof typeof DEFAULT_CONTENT] as NonNullable<PortfolioContent[K]>;
    // Array-typed keys (chatSuggestions, aboutStats) must actually be arrays.
    if (Array.isArray(fallback)) {
      return Array.isArray(value) && value.length ? (value as NonNullable<PortfolioContent[K]>) : fallback;
    }
    if (value !== undefined && value !== null && value !== '') {
      return value as NonNullable<PortfolioContent[K]>;
    }
    return fallback;
  }

  return { content, c };
}
