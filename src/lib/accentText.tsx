import type { ReactNode } from 'react';

/**
 * Renders a copy string with `*word*` segments as lime italic serif accents.
 * Used by the hero headline and contact heading (editable in Admin → Site copy).
 */
export function renderAccent(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="font-serif italic text-accent">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
