import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getBlogPosts } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_BLOG_POSTS } from '@/data/defaults';
import type { BlogPost } from '@/types/portfolio';
import reactImage from '@/assets/blog-react.jpg';
import analyticsImage from '@/assets/blog-analytics.jpg';
import careerImage from '@/assets/blog-career.jpg';

// Fallback images for the 3 default posts (matched by order index)
const FALLBACK_IMAGES = [reactImage, analyticsImage, careerImage];

export const Blog = () => {
  const { ref, isVisible } = useScrollAnimation();

  const { data: firestorePosts } = useQuery({
    queryKey: ['blog'],
    queryFn: getBlogPosts,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const rawPosts: BlogPost[] = (firestorePosts && firestorePosts.length > 0) ? firestorePosts : DEFAULT_BLOG_POSTS;

  // Resolve empty images: use local fallback by order index
  const posts = rawPosts.map((p, i) => ({
    ...p,
    image: p.image || FALLBACK_IMAGES[i] || '',
  }));

  return (
    <section id="blog" ref={ref} className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-[hsl(var(--gradient-mid))] to-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4">Latest Insights</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Thoughts on development, football, and technology
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {posts.map((post, index) => (
            <motion.article
              key={post.id ?? index}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-105 hover:glow-accent"
            >
              <div className="relative overflow-hidden aspect-video bg-secondary/30">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
            <a href="#">View All Posts</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
