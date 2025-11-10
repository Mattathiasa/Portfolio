import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import reactImage from '@/assets/blog-react.jpg';
import analyticsImage from '@/assets/blog-analytics.jpg';
import careerImage from '@/assets/blog-career.jpg';

const blogPosts = [
  {
    title: 'Building Scalable React Applications',
    excerpt: 'Learn best practices for structuring large-scale React applications with TypeScript, state management, and performance optimization.',
    image: reactImage,
    category: 'Development',
    date: '2024-11-05',
    readTime: '8 min read',
    link: '#',
  },
  {
    title: 'Football Analytics: Data-Driven Insights',
    excerpt: 'How data analytics is revolutionizing football strategy, player performance tracking, and match prediction using modern technologies.',
    image: analyticsImage,
    category: 'Analytics',
    date: '2024-10-28',
    readTime: '6 min read',
    link: '#',
  },
  {
    title: 'My Journey into Software Engineering',
    excerpt: 'From choosing computer science to graduating as a software engineer - lessons learned, challenges faced, and advice for aspiring developers.',
    image: careerImage,
    category: 'Career',
    date: '2024-10-15',
    readTime: '10 min read',
    link: '#',
  },
];

export const Blog = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="blog" ref={ref} className="py-24 relative bg-gradient-to-b from-[hsl(var(--gradient-mid))] to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold gradient-text mb-4">Latest Insights</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thoughts on development, football, and technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-105 hover:glow-accent"
            >
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <Button
                  variant="ghost"
                  className="text-accent hover:text-accent hover:bg-accent/10 p-0 h-auto"
                  asChild
                >
                  <a href={post.link} className="inline-flex items-center gap-2">
                    Read More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
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
          <Button
            size="lg"
            variant="outline"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            asChild
          >
            <a href="#">View All Posts</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
