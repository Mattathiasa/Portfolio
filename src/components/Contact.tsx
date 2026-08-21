import { useRef, useState } from 'react';
import { Mail, Phone, MapPin, Send, Github, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
import { useQuery } from '@tanstack/react-query';
import { getContactData, getContent } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTACT, DEFAULT_CONTENT } from '@/data/defaults';
import { SplitReveal } from '@/components/SplitReveal';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

export const Contact = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const magneticRef = useRef<HTMLDivElement>(null);

  const { data: contactData } = useQuery({
    queryKey: ['contact'],
    queryFn: getContactData,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const c = contactData ?? DEFAULT_CONTACT;
  const contactHeading = content?.contactHeading ?? DEFAULT_CONTENT.contactHeading;
  const contactSubtitle = content?.contactSubtitle ?? DEFAULT_CONTENT.contactSubtitle;

  const contactInfo = [
    { icon: Mail,    label: 'Email',    value: c.email,    link: `mailto:${c.email}` },
    { icon: Phone,   label: 'Phone',    value: c.phone,    link: `tel:${c.phone.replace(/\s/g, '')}` },
    { icon: MapPin,  label: 'Location', value: c.location, link: c.locationUrl },
  ];

  const socialLinks = [
    { icon: Github,   label: 'GitHub',    link: c.github },
    { icon: Linkedin, label: 'LinkedIn',  link: c.linkedin },
    { icon: Instagram,label: 'Instagram', link: c.instagram },
  ];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Screen-reader status for the submit result (toasts alone aren't reliably announced).
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('Sending your message…');

    try {
      // Send email using EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'mattathiasabraham@gmail.com',
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      toast.success('Message sent!', {
        description: "Thanks for reaching out. I'll get back to you soon!",
      });
      setStatus("Message sent! Thanks for reaching out — I'll get back to you soon.");

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Error sending message', {
        description: 'Please try again or contact me directly via email.',
      });
      setStatus('Message failed to send. Please try again or email me directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > 500) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
          finePointer: '(pointer: fine) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const reveals = gsap.utils.toArray<HTMLElement>('.contact-reveal', section);

          if (ctx.conditions?.reduced) {
            gsap.set(reveals, { opacity: 1, y: 0 });
            return;
          }

          gsap.set(reveals, { opacity: 0, y: 28 });
          ScrollTrigger.batch(reveals, {
            start: 'top 88%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out' }),
          });

          // Magnetic submit button (desktop pointers only).
          if (ctx.conditions?.finePointer && magneticRef.current) {
            const wrap = magneticRef.current;
            const xTo = gsap.quickTo(wrap, 'x', { duration: 0.4, ease: 'power3.out' });
            const yTo = gsap.quickTo(wrap, 'y', { duration: 0.4, ease: 'power3.out' });

            const onMove = (e: MouseEvent) => {
              const rect = wrap.getBoundingClientRect();
              const dx = e.clientX - (rect.left + rect.width / 2);
              const dy = e.clientY - (rect.top + rect.height / 2);
              const dist = Math.hypot(dx, dy);
              const radius = 140;
              if (dist < radius) {
                const pull = 1 - dist / radius;
                xTo(dx * pull * 0.4);
                yTo(dy * pull * 0.4);
              } else {
                xTo(0);
                yTo(0);
              }
            };
            window.addEventListener('mousemove', onMove);
            return () => window.removeEventListener('mousemove', onMove);
          }
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section id="contact" ref={sectionRef} className="min-h-screen flex items-center justify-center relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12 sm:mb-16">
          <SplitReveal
            as="h2"
            type="chars"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4"
          >
            {contactHeading}
          </SplitReveal>
          <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {contactSubtitle}
          </SplitReveal>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="contact-reveal space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="bg-secondary border-border focus:border-accent"
                  />
                </div>
                <div className="contact-reveal space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="bg-secondary border-border focus:border-accent"
                  />
                </div>
              </div>
              <div className="contact-reveal space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  required
                  className="bg-secondary border-border focus:border-accent"
                />
              </div>
              <div className="contact-reveal space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Message
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {formData.message.length}/500
                  </span>
                </div>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project..."
                  required
                  rows={6}
                  className="bg-secondary border-border focus:border-accent resize-none"
                />
              </div>
              <div ref={magneticRef} className="contact-reveal will-change-transform">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth glow-accent"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
              {/* Screen-reader announcement of the submit outcome. */}
              <p role="status" aria-live="polite" className="sr-only">
                {status}
              </p>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="contact-reveal glass-card p-6 sm:p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-accent">{c.availabilityText}</span>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {contactInfo.map((info, index) => {
                  const content = (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                        <info.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
                        <p className="text-foreground font-medium">{info.value}</p>
                      </div>
                    </>
                  );
                  // Guard against a missing link (e.g. locationUrl not configured).
                  return info.link ? (
                    <a
                      key={index}
                      href={info.link}
                      aria-label={`${info.label}: ${info.value}`}
                      className="flex items-start gap-4 group transition-smooth hover:translate-x-2"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={index} className="flex items-start gap-4 group">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="contact-reveal glass-card p-6 sm:p-8 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Connect With Me</h3>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-3 hover:bg-accent group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-6 h-6 text-accent group-hover:text-accent-foreground transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
