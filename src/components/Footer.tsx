import { Mail, Phone, MapPin, Github, Linkedin, Instagram } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getContent, getContactData } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTENT, DEFAULT_CONTACT } from '@/data/defaults';

const QUICK_LINKS = [
  { name: 'Home',     href: '#home' },
  { name: 'About',    href: '#about' },
  { name: 'Skills',   href: '#skills' },
  { name: 'Projects', href: '#projects' },
  { name: 'Blog',     href: '#blog' },
  { name: 'Contact',  href: '#contact' },
];

export const Footer = () => {
  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: contactData } = useQuery({
    queryKey: ['contact'],
    queryFn: getContactData,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const c        = contactData ?? DEFAULT_CONTACT;
  const initials = content?.siteInitials ?? DEFAULT_CONTENT.siteInitials;
  const bio      = content?.footerBio    ?? DEFAULT_CONTENT.footerBio;
  const name     = content?.heroTitle    ?? DEFAULT_CONTENT.heroTitle;

  const contactItems = [
    { icon: Mail,   text: c.email,    href: `mailto:${c.email}`,                   external: false },
    { icon: Phone,  text: c.phone,    href: `tel:${c.phone.replace(/\s/g, '')}`,   external: false },
    { icon: MapPin, text: c.location, href: c.locationUrl,                          external: true  },
  ];

  const socialItems = [
    { icon: Github,    href: c.github,    label: 'GitHub' },
    { icon: Linkedin,  href: c.linkedin,  label: 'LinkedIn' },
    { icon: Instagram, href: c.instagram, label: 'Instagram' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-background to-[hsl(var(--gradient-end))] border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-8">

          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-display gradient-text">{initials}</h3>
            <p className="text-sm text-muted-foreground">{bio}</p>
            <div className="flex gap-3">
              {socialItems.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center transition-smooth hover:bg-accent hover:scale-110 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map(link => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Contact Info</h4>
            <ul className="space-y-3">
              {contactItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <item.icon className="w-4 h-4 text-accent mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
