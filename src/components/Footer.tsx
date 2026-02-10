import { Mail, Phone, MapPin, Github, Linkedin, Instagram } from 'lucide-react';

const footerLinks = {
  quickLinks: [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Skills', href: '#skills' },
    { name: 'Projects', href: '#projects' },
    { name: 'Contact', href: '#contact' },
  ],
  contact: [
    { icon: Mail, text: 'mattathiasabraham@gmail.com' },
    { icon: Phone, text: '+251 902 212 622' },
    { icon: MapPin, text: 'Addis Ababa, Ethiopia' },
  ],
  social: [
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  ],
};

export const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-background to-[hsl(var(--gradient-end))] border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-display gradient-text">MA</h3>
            <p className="text-sm text-muted-foreground">
              Software Engineer & Football Content Creator passionate about building innovative
              solutions and creating engaging content.
            </p>
            <div className="flex gap-3">
              {footerLinks.social.map((social, index) => (
                <a
                  key={index}
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
              {footerLinks.quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
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
              {footerLinks.contact.map((contact, index) => (
                <li key={index} className="flex items-start gap-2">
                  <contact.icon className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{contact.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Mattathias Abraham. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
