import { lazy, Suspense, useState } from 'react';
import { Preloader } from '@/components/Preloader';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Skills } from '@/components/Skills';
import { Projects } from '@/components/Projects';
import { Blog } from '@/components/Blog';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { PortfolioChat } from '@/components/PortfolioChat';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';

// Separate chunk (~150 KB gz of three.js) warmed by the preloader.
const SceneCanvas = lazy(() => import('@/components/three/SceneCanvas'));

const Index = () => {
  const [introReady, setIntroReady] = useState(false);

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen">
        <Suspense fallback={null}>
          <SceneCanvas />
        </Suspense>

        {/* Content mounts behind the preloader so the scene and layout are
            warm when the wipe reveals them. */}
        {!introReady && <Preloader onComplete={() => setIntroReady(true)} />}

        <Navigation />
        <main>
          <Hero introReady={introReady} />
          <About />
          <Skills />
          <Projects />
          <Blog />
          <Contact />
        </main>
        <Footer />
        <PortfolioChat />
      </div>
    </SmoothScrollProvider>
  );
};

export default Index;
