import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn, isValidLink, toExternalUrl } from '@/lib/utils';

type UrlInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string | undefined;
  onChange: (value: string) => void;
};

// Link field for the admin panel: fills in a missing https:// when the field
// loses focus and flags anything that still isn't a usable link, so callers can
// block saving with isValidLink().
export function UrlInput({ value, onChange, onBlur, className, ...props }: UrlInputProps) {
  const invalid = !isValidLink(value);
  return (
    <>
      <Input
        {...props}
        type="url"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value ?? ''}
        aria-invalid={invalid}
        className={cn(className, invalid && 'border-destructive focus-visible:ring-destructive')}
        onChange={e => onChange(e.target.value)}
        onBlur={e => {
          const fixed = toExternalUrl(e.target.value.trim());
          if (fixed !== value && isValidLink(fixed)) onChange(fixed);
          onBlur?.(e);
        }}
      />
      {invalid && <p className="text-[11px] text-destructive">Enter a full link, e.g. https://example.vercel.app</p>}
    </>
  );
}
