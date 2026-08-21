import { useRef } from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getBlogPosts, getContent } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_BLOG_POSTS, DEFAULT_CONTENT } from '@/data/defaults';
import type { BlogPost } from '@/types/portfolio';
import { SplitReveal } from '@/components/SplitReveal';
import { gsap, useGSAP } from '@/lib/gsap';

export const Blog = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { data: firestorePosts } = useQuery({
    queryKey: ['blog'],
    queryFn: getBlogPosts,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const rawPosts: BlogPost[] = (firestorePosts && firestorePosts.length > 0)
    ? firestorePosts
    : DEFAULT_BLOG_POSTS;

  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const blogHeading = content?.blogHeading ?? DEFAULT_CONTENT.blogHeading;
  const blogSubtitle = content?.blogSubtitle ?? DEFAULT_CONTENT.blogSubtitle;
  const blogViewAllText = content?.blogViewAllText ?? DEFAULT_CONTENT.blogViewAllText;

  const posts = rawPosts;

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
          const cards = gsap.utils.toArray<HTMLElement>('.blog-card', section);

          if (ctx.conditions?.reduced) {
            gsap.set([cards, '.blog-cta'], { opacity: 1, y: 0 });
            return;
          }

          // Alternating editorial stagger: odd cards start lower.
          cards.forEach((card, i) => {
            gsap.from(card, {
              opacity: 0,
              y: i % 2 === 0 ? 40 : 90,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: { trigger: card, start: 'top 88%', once: true },
            });

            const img = card.querySelector('.blog-image');
            if (img) {
              gsap.fromTo(
                img,
                { yPercent: -8 },
                {
                  yPercent: 8,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: card,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                  },
                }
              );
            }
          });

          gsap.from('.blog-cta', {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.blog-cta', start: 'top 92%', once: true },
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [posts.length], revertOnUpdate: true }
  );

  return (
    <section
      id="blog"
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-[hsl(var(--gradient-mid))] to-background py-16 sm:py-24"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <SplitReveal
            as="h2"
            type="chars"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4"
          >
            {blogHeading}
          </SplitReveal>
          <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {blogSubtitle}
          </SplitReveal>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">Blog coming soon</p>
            <p className="text-sm text-muted-foreground/60">I will be sharing insights on mobile development, Flutter, React Native, and building scalable systems.</p>
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {posts.map((post, index) => (
            <article
              key={post.id ?? index}
              className="blog-card glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-105 hover:glow-accent"
            >
              <div className="relative overflow-hidden aspect-video bg-secondary/30">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className="blog-image w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-125"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-5xl font-bold">
                    {post.title[0]}
                  </div>
                )}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                  <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                {post.link && post.link !== '#' ? (
                  <Button variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 p-0 h-auto" asChild>
                    <a href={post.link} className="inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                      Read More
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground/50 border border-border/40 rounded-full px-3 py-1">
                    Coming Soon
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
        )}

        {posts.length > 0 && (
          <div className="blog-cta text-center">
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
              <a href="#">{blogViewAllText}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
