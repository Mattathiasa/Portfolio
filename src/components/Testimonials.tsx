import { useRef, useState } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTestimonials } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_TESTIMONIALS } from '@/data/defaults';
import { SplitReveal } from '@/components/SplitReveal';
import { gsap, useGSAP } from '@/lib/gsap';
import { motion, AnimatePresence } from 'framer-motion';

export const Testimonials = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const { data: firestoreTestimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const testimonials = (firestoreTestimonials && firestoreTestimonials.length > 0)
    ? firestoreTestimonials.sort((a, b) => a.order - b.order)
    : DEFAULT_TESTIMONIALS;

  const next = () => setActive(i => (i + 1) % testimonials.length);
  const prev = () => setActive(i => (i - 1 + testimonials.length) % testimonials.length);

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
            gsap.set('.testimonial-card', { opacity: 1, y: 0 });
            return;
          }

          gsap.set('.testimonial-card', { opacity: 0, y: 40 });
          ScrollTrigger.batch('.testimonial-card', {
            start: 'top 88%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' }),
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [testimonials.length], revertOnUpdate: true }
  );

  if (testimonials.length === 0) return null;

  return (
    <section
      id="testimonials"
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
            What People Say
          </SplitReveal>
          <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Feedback from colleagues, clients, and collaborators
          </SplitReveal>
        </div>

        {/* Desktop: Grid of cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, index) => (
            <div
              key={t.id ?? index}
              className="testimonial-card glass-card p-6 lg:p-8 rounded-2xl border border-accent/10 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              <Quote className="w-10 h-10 text-accent/20 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-sm sm:text-[0.95rem] text-muted-foreground leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                  {t.author.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}{t.company ? ` · ${t.company}` : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden">
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-6 rounded-2xl border border-accent/10"
              >
                <Quote className="w-8 h-8 text-accent/20 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
                  "{testimonials[active].quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                    {testimonials[active].author.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{testimonials[active].author}</p>
                    <p className="text-xs text-muted-foreground">{testimonials[active].role}{testimonials[active].company ? ` · ${testimonials[active].company}` : ''}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="w-9 h-9 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-accent w-6' : 'bg-accent/30'}`}
                />
              ))}
            </div>
            <button onClick={next} className="w-9 h-9 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
