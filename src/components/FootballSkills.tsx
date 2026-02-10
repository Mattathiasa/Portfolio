import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faXmark } from '@fortawesome/free-solid-svg-icons';

const FootballSkills = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullscreenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Play/pause video based on isPlaying state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      // Start muted initially (will unmute in fullscreen via separate effect)
      video.muted = true;
      video.play().catch(err => console.log('Play failed:', err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  // Handle mute/unmute based on hover or fullscreen state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Unmute when hovering floating video OR in fullscreen
    video.muted = !(isVideoHovered || isFullscreen);
  }, [isVideoHovered, isFullscreen]);

  // Auto-hide floating video after 5 seconds of no hover
  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isPlaying && !isVideoHovered && !isFullscreen) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        setIsVideoHovered(false);
      }, 5000);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [isVideoHovered, isPlaying, isFullscreen]);

  // Auto-fullscreen after 5 seconds of hover
  useEffect(() => {
    if (fullscreenTimeoutRef.current) {
      clearTimeout(fullscreenTimeoutRef.current);
      fullscreenTimeoutRef.current = null;
    }

    if (isVideoHovered && isPlaying && !isFullscreen) {
      fullscreenTimeoutRef.current = setTimeout(() => {
        setIsFullscreen(true);
      }, 5000);
    }

    return () => {
      if (fullscreenTimeoutRef.current) {
        clearTimeout(fullscreenTimeoutRef.current);
        fullscreenTimeoutRef.current = null;
      }
    };
  }, [isVideoHovered, isPlaying, isFullscreen]);

  // Keyboard controls (ESC to exit fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Touch swipe down to exit fullscreen (mobile)
  useEffect(() => {
    if (!isFullscreen) return;

    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchEndY - touchStartY;
      if (swipeDistance > 100) {
        handleExitFullscreen();
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isFullscreen]);

  const handleClick = () => {
    setIsPlaying(true);
  };

  const handleVideoMouseEnter = () => {
    if (!isFullscreen) {
      setIsVideoHovered(true);
    }
  };

  const handleVideoMouseLeave = () => {
    if (!isFullscreen) {
      setIsVideoHovered(false);
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    setIsVideoHovered(false);
  };

  return (
    <>
      {/* Football emoji button */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 cursor-pointer ${
          isPlaying ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
        }`}
        onClick={handleClick}
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-accent/90 to-accent rounded-full flex items-center justify-center shadow-lg border-2 border-accent/50 group-hover:scale-110 group-hover:border-accent transition-all duration-300">
            <FontAwesomeIcon icon={faFutbol} className="text-3xl" />
          </div>
        </div>
      </div>

      {/* Fullscreen backdrop blur overlay (only visible in fullscreen) */}
      <div 
        className={`fixed inset-0 z-[99] backdrop-blur-3xl bg-background/30 transition-opacity duration-500 ${
          isFullscreen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Video Container - transitions between floating and fullscreen */}
      <div
        className={`fixed transition-all duration-500 ease-out ${
          isFullscreen
            ? 'inset-0 z-[100] opacity-100 scale-100'
            : isPlaying
            ? `bottom-4 right-4 z-50 scale-100 ${isVideoHovered ? 'opacity-100' : 'opacity-40'}`
            : 'bottom-4 right-4 z-50 opacity-0 scale-75 pointer-events-none'
        }`}
        style={!isFullscreen ? {
          width: '280px',
          height: '500px',
        } : undefined}
        onMouseEnter={handleVideoMouseEnter}
        onMouseLeave={handleVideoMouseLeave}
      >
        {/* Video container with enhanced styling */}
        <div className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ${
          isFullscreen 
            ? 'p-8 md:p-16' 
            : 'rounded-lg overflow-hidden shadow-2xl border-2 border-accent/50'
        }`}>
          {/* Enhanced video with shadow and glow in fullscreen */}
          <div className={`relative w-full h-full ${
            isFullscreen ? 'rounded-2xl overflow-hidden shadow-2xl ring-2 ring-accent/30' : ''
          }`}>
            {/* Glow effect behind video in fullscreen */}
            {isFullscreen && (
              <div className="absolute inset-0 bg-accent/20 blur-3xl scale-110 -z-10" />
            )}
            
            <video
              ref={videoRef}
              className={`w-full h-full transition-all duration-500 ${
                isFullscreen ? 'object-contain rounded-2xl' : 'object-cover'
              }`}
              loop
              playsInline
            >
              <source src="/football-skills.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Back to portfolio button (only visible in fullscreen) */}
        <button
          onClick={handleExitFullscreen}
          className={`absolute top-6 right-6 z-10 group transition-all duration-300 ${
            isFullscreen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
          }`}
          aria-label="Back to portfolio"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
            <div className="relative w-12 h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-accent/50 group-hover:border-accent group-hover:bg-background transition-all duration-300 shadow-lg">
              <FontAwesomeIcon icon={faXmark} className="text-xl text-foreground" />
            </div>
          </div>
        </button>

        {/* Swipe indicator for mobile (only visible in fullscreen) */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/60 text-sm md:hidden animate-pulse transition-opacity duration-300 ${
          isFullscreen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          Swipe down to exit
        </div>
      </div>
    </>
  );
};

export default FootballSkills;
