import { useRef, useState } from 'react';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
import { useQuery } from '@tanstack/react-query';
import { getContactData } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTACT } from '@/data/defaults';
import { useContent } from '@/hooks/useContent';
import { renderAccent } from '@/lib/accentText';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

export const Contact = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { c: copy } = useContent();

  const { data: contactData } = useQuery({
    queryKey: ['contact'],
    queryFn: getContactData,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const c = contactData ?? DEFAULT_CONTACT;

  const elsewhereLinks = [
    { label: 'GitHub', link: c.github },
    { label: 'LinkedIn', link: c.linkedin },
    { label: 'Instagram', link: c.instagram },
  ].filter((l) => l.link);

  const directLinks = [
    { label: c.phone, link: `tel:${c.phone.replace(/\s/g, '')}` },
    { label: c.location, link: c.locationUrl },
  ].filter((l) => l.label);

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

      toast.success(copy('formSuccess'));
      setStatus(copy('formSuccess'));

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(copy('formError'));
      setStatus(copy('formError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        },
        (ctx) => {
          const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', section);
          if (ctx.conditions?.reduced) {
            gsap.set(reveals, { opacity: 1, y: 0 });
            return;
          }
          gsap.set(reveals, { opacity: 0, y: 24 });
          ScrollTrigger.batch(reveals, {
            start: 'top 88%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }),
          });
        }
      );
    },
    { scope: sectionRef }
  );

  const inputClass =
    'h-11 w-full rounded-md border border-foreground/15 bg-background px-3.5 text-[15px] text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-accent';

  return (
    <section id="contact" ref={sectionRef} className="section-shell relative [scroll-margin-top:64px]">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        {/* Left: headline + links */}
        <div>
          <p data-reveal className="mono-label mb-6 flex flex-wrap items-center gap-x-2">
            <span>{copy('contactIndexLabel')}</span>
            <span aria-hidden>·</span>
            <span className="text-accent">{c.availabilityText}</span>
          </p>
          <h2 data-reveal className="!text-[clamp(36px,5.5vw,84px)]">
            {renderAccent(copy('contactHeading'))}
          </h2>
          <a
            data-reveal
            href={`mailto:${c.email}`}
            className="mt-8 inline-block break-all font-mono text-[clamp(16px,2.4vw,26px)] text-foreground underline decoration-foreground/25 underline-offset-8 transition-colors hover:text-accent hover:decoration-accent"
          >
            {c.email}
          </a>

          <div data-reveal className="mt-12 grid grid-cols-2 gap-8 border-t hairline pt-8">
            <div>
              <p className="mono-label mb-4">{copy('elsewhereLabel')}</p>
              <ul className="space-y-2.5">
                {elsewhereLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] text-foreground/70 transition-colors hover:text-accent"
                    >
                      {item.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mono-label mb-4">{copy('directLabel')}</p>
              <ul className="space-y-2.5">
                {directLinks.map((item) =>
                  item.link ? (
                    <li key={item.label}>
                      <a
                        href={item.link}
                        className="text-[15px] text-foreground/70 transition-colors hover:text-accent"
                      >
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.label} className="text-[15px] text-foreground/70">
                      {item.label}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <div data-reveal className="self-start rounded-lg border hairline bg-card p-[clamp(20px,3vw,32px)]">
          <h3 className="!text-[26px]">{copy('formHeading')}</h3>
          <p className="mt-1.5 text-sm text-foreground/60">{copy('formIntro')}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="mono-label !text-[11px]">
                  {copy('formName')}
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="mono-label !text-[11px]">
                  {copy('formEmail')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="subject" className="mono-label !text-[11px]">
                {copy('formSubject')}
              </label>
              <input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="message" className="mono-label !text-[11px]">
                  {copy('formMessage')}
                </label>
                <span className="font-mono text-[11px] text-foreground/40">
                  {formData.message.length}/500
                </span>
              </div>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className={`${inputClass} h-auto resize-none py-3 leading-relaxed`}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 font-mono text-xs uppercase tracking-[0.06em] text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : copy('formSubmit')}
            </button>
            {/* Screen-reader announcement of the submit outcome. */}
            <p role="status" aria-live="polite" className="sr-only">
              {status}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
