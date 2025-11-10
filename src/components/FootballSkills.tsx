import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';

const FootballSkills = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(err => console.log('Play failed:', err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Handle audio based on hover state
    video.muted = !isVideoHovered;
  }, [isVideoHovered]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Start timeout to hide video after 5 seconds when not hovering and video is playing
    if (isPlaying && !isVideoHovered) {
      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        setIsVideoHovered(false);
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVideoHovered, isPlaying]);

  const handleClick = () => {
    setIsPlaying(true);
  };

  const handleVideoMouseEnter = () => {
    setIsVideoHovered(true);
  };

  const handleVideoMouseLeave = () => {
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

      {/* Video player */}
      <div
        className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ease-in-out ${
          isPlaying
            ? `scale-100 ${isVideoHovered ? 'opacity-100' : 'opacity-40'}`
            : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{
          width: '280px',
          height: '500px',
        }}
        onMouseEnter={handleVideoMouseEnter}
        onMouseLeave={handleVideoMouseLeave}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl border-2 border-accent/50">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
          >
            <source src="/football-skills.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </>
  );
};

export default FootballSkills;
