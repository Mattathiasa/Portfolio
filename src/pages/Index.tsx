import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { Projects } from '@/components/Projects';
import { About } from '@/components/About';
import { Experience } from '@/components/Experience';
import { Skills } from '@/components/Skills';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { PortfolioChat } from '@/components/PortfolioChat';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';
import { ScrollTrigger } from '@/lib/gsap';

// Separate chunk (~150 KB gz of three.js), mounted after first paint.
const SceneCanvas = lazy(() => import('@/components/three/SceneCanvas'));

const Index = () => {
  const [showScene, setShowScene] = useState(false);

  // Mount the three.js backdrop once the main thread is idle so it never
  // competes with first paint.
  useEffect(() => {
    const arm = () => setShowScene(true);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(arm, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(arm, 300);
    return () => window.clearTimeout(id);
  }, []);

  // Recalculate ScrollTrigger positions once the swapped-in fonts settle.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen">
        {/* Decorative 3D backdrop — if WebGL/Three.js fails, fail silently
            rather than taking down the whole page. */}
        {showScene && (
          <ErrorBoundary name="SceneCanvas" fallback={null}>
            <Suspense fallback={null}>
              <SceneCanvas />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Radial lime glow above the point field, below all content. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{
            background:
              'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(221, 235, 157, 0.07), transparent 60%)',
          }}
        />

        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Projects />
          <About />
          <Experience />
          <Skills />
          <Contact />
        </main>
        <Footer />
        <PortfolioChat />
      </div>
    </SmoothScrollProvider>
  );
};

export default Index;
