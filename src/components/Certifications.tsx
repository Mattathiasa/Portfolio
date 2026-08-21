import { useRef } from 'react';
import { Award, ExternalLink, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCertifications } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CERTIFICATIONS } from '@/data/defaults';
import { SplitReveal } from '@/components/SplitReveal';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

export const Certifications = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { data: firestoreCerts } = useQuery({
    queryKey: ['certifications'],
    queryFn: getCertifications,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const certs = (firestoreCerts && firestoreCerts.length > 0)
    ? firestoreCerts.sort((a, b) => a.order - b.order)
    : DEFAULT_CERTIFICATIONS;

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
          if (ctx.conditions?.reduced) {
            gsap.set('.cert-card', { opacity: 1, y: 0 });
            return;
          }

          gsap.set('.cert-card', { opacity: 0, y: 30 });
          ScrollTrigger.batch('.cert-card', {
            start: 'top 88%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }),
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [certs.length], revertOnUpdate: true }
  );

  if (certs.length === 0) return null;

  return (
    <section
      id="certifications"
      ref={sectionRef}
      className="py-16 sm:py-24 relative"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <SplitReveal
            as="h2"
            type="chars"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4"
          >
            Education & Certifications
          </SplitReveal>
          <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Academic background and professional credentials
          </SplitReveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {certs.map((cert, index) => (
            <div
              key={cert.id ?? index}
              className="cert-card glass-card p-5 sm:p-6 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  {cert.name.includes('BSc') || cert.name.includes('Degree') || cert.name.includes('University') ? (
                    <GraduationCap className="w-5 h-5 text-accent" />
                  ) : (
                    <Award className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">{cert.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cert.issuer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{cert.date}</span>
                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                      >
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
