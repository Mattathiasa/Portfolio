import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContactData } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTACT } from '@/data/defaults';
import { useContent } from '@/hooks/useContent';

export const Navigation = () => {
  const { c } = useContent();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // On the homepage the section links are in-page hashes (smooth-scrolled by
  // Lenis). On other routes they point back to the homepage; native hash
  // scrolling + each section's scroll-margin-top handles the 64px nav offset.
  const onHome = pathname === '/';
  const sectionHref = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const homeHref = onHome ? '#home' : '/';

  const { data: contactData } = useQuery({
    queryKey: ['contact'],
    queryFn: getContactData,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const email = contactData?.email ?? DEFAULT_CONTACT.email;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const links = [
    { label: c('navWork'), href: sectionHref('work') },
    { label: c('navAbout'), href: sectionHref('about') },
    { label: c('navExperience'), href: sectionHref('experience') },
    { label: c('navStack'), href: sectionHref('skills') },
    { label: c('navContact'), href: sectionHref('contact') },
  ];

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-40 h-16 transition-colors duration-300 ${
        scrolled || menuOpen
          ? 'border-b hairline bg-[rgba(14,25,29,0.8)] backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-[clamp(20px,4vw,48px)]">
        {/* Brand */}
        <a href={homeHref} className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          <span className="font-mono text-[13px] tracking-[0.02em] text-foreground">
            {c('brandLabel')}
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 min-[900px]:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mono-label !text-[11px] transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href={c('cvUrl')}
            className="mono-label !text-[11px] transition-colors hover:text-foreground"
          >
            {c('navResume')}
          </a>
          <a
            href={`mailto:${email}`}
            className="rounded-full bg-accent px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            {c('navHire')}
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="rounded-full border border-foreground/25 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-foreground transition-colors hover:border-accent hover:text-accent min-[900px]:hidden"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </nav>
    </header>

      {/* Mobile menu: full-width serif list. Rendered as a sibling of the
          header — its backdrop-filter would otherwise become the containing
          block for this fixed overlay and collapse it to zero height. */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-[rgba(14,25,29,0.97)] backdrop-blur-xl min-[900px]:hidden"
        >
          <div className="flex min-h-full flex-col justify-between px-[clamp(20px,4vw,48px)] py-10">
            <ul className="space-y-1">
              {links.map((link, i) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-4 border-b border-foreground/10 py-4"
                  >
                    <span className="mono-label !text-accent/70">0{i + 1}</span>
                    <span className="font-serif text-4xl text-foreground transition-colors group-hover:text-accent">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={c('cvUrl')}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-baseline gap-4 py-4"
                >
                  <span className="mono-label !text-accent/70">06</span>
                  <span className="font-serif text-4xl text-foreground transition-colors group-hover:text-accent">
                    {c('navResume')}
                  </span>
                </a>
              </li>
            </ul>
            <a
              href={`mailto:${email}`}
              onClick={() => setMenuOpen(false)}
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 font-mono text-xs uppercase tracking-[0.06em] text-accent-foreground"
            >
              {c('navHire')} — {email}
            </a>
          </div>
        </div>
      )}
    </>
  );
};
