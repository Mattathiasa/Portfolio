import { Link } from 'react-router-dom';
import { useContent } from '@/hooks/useContent';

export const Footer = () => {
  const { c } = useContent();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t hairline">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-[clamp(20px,4vw,48px)] py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-foreground/45">
          © {year} {c('heroTitle')}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-foreground/45">
          {c('footerCredit')}
        </p>
        <Link
          to="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-foreground/30 transition-colors hover:text-accent"
        >
          admin
        </Link>
      </div>
    </footer>
  );
};
