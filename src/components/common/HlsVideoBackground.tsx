import React, { useEffect, useRef, useState } from 'react';
import type HlsType from 'hls.js';

interface HlsVideoBackgroundProps {
  opacity?: number;
  isPaused?: boolean;
  isDark?: boolean;
}

export const HLS_VIDEO_URL =
  'https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8';

export const HlsVideoBackground: React.FC<HlsVideoBackgroundProps> = ({
  opacity = 1.0,
  isPaused = false,
  isDark = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: HlsType | null = null;
    let isCancelled = false;

    const attemptPlay = () => {
      if (!isPaused && video) {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Browser may restrict autoplay until first user tap
            });
        }
      }
    };

    // 1. If browser natively supports HLS (iOS, Safari, macOS), use native without downloading hls.js
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_VIDEO_URL;
      video.addEventListener('loadedmetadata', attemptPlay);
    } else {
      // 2. Otherwise asynchronously import hls.js on demand
      import('hls.js').then(({ default: Hls }) => {
        if (isCancelled || !video) return;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
          });
          hlsInstance = hls;

          hls.loadSource(HLS_VIDEO_URL);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            attemptPlay();
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  setHasError(true);
                  break;
              }
            }
          });
        }
      }).catch(() => {
        setHasError(true);
      });
    }

    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);

    // Global listener to immediately start video on first user interaction if autoplay was blocked
    const handleFirstUserInteraction = () => {
      if (video && video.paused && !isPaused) {
        attemptPlay();
      }
    };
    window.addEventListener('pointerdown', handleFirstUserInteraction, { once: true });
    window.addEventListener('keydown', handleFirstUserInteraction, { once: true });

    return () => {
      isCancelled = true;
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      window.removeEventListener('pointerdown', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (video) {
        video.removeEventListener('loadedmetadata', attemptPlay);
      }
    };
  }, [isPaused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 transition-opacity duration-700"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* 1. Permanent High-Brightness Fluid Mesh Aurora Layer (Always running, 100% full screen) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDark ? (
          /* Dark Mode Fluid Mesh Aurora */
          <div className="absolute -inset-[20%] w-[140%] h-[140%] animate-aurora-fluid pointer-events-none opacity-90">
            <div
              className="absolute top-1/4 left-1/4 w-[55vw] h-[55vw] rounded-full filter blur-[90px] animate-plasma-pulse"
              style={{
                background:
                  'radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(79, 70, 229, 0.3) 45%, transparent 70%)',
              }}
            />
            <div
              className="absolute top-1/3 right-1/4 w-[50vw] h-[50vw] rounded-full filter blur-[95px] animate-plasma-pulse [animation-delay:2s]"
              style={{
                background:
                  'radial-gradient(circle, rgba(236, 72, 153, 0.42) 0%, rgba(217, 70, 239, 0.28) 45%, transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-1/4 left-1/3 w-[60vw] h-[60vw] rounded-full filter blur-[100px] animate-plasma-pulse [animation-delay:4s]"
              style={{
                background:
                  'radial-gradient(circle, rgba(245, 158, 11, 0.38) 0%, rgba(239, 68, 68, 0.25) 50%, transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-1/3 right-1/3 w-[45vw] h-[45vw] rounded-full filter blur-[85px] animate-plasma-pulse [animation-delay:6s]"
              style={{
                background:
                  'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 70%)',
              }}
            />
          </div>
        ) : (
          /* Light Mode Radiant Prismatic Silk Aurora */
          <div className="absolute -inset-[20%] w-[140%] h-[140%] animate-light-aurora pointer-events-none opacity-85">
            <div
              className="absolute top-1/4 left-1/4 w-[55vw] h-[55vw] rounded-full filter blur-[90px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(192, 132, 252, 0.35) 0%, rgba(165, 180, 252, 0.25) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute top-1/3 right-1/4 w-[50vw] h-[50vw] rounded-full filter blur-[95px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(244, 114, 182, 0.25) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute bottom-1/4 left-1/3 w-[60vw] h-[60vw] rounded-full filter blur-[100px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(56, 189, 248, 0.32) 0%, rgba(129, 140, 248, 0.2) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute bottom-1/3 right-1/3 w-[48vw] h-[48vw] rounded-full filter blur-[85px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(234, 179, 8, 0.2) 50%, transparent 75%)',
              }}
            />
          </div>
        )}
      </div>

      {/* 2. Full-Page Cinematic HLS Video (Object-cover filling entire screen) */}
      {!hasError && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isPlaying ? 'opacity-100' : 'opacity-80'
          }`}
          style={{
            filter: isDark
              ? 'brightness(1.0) contrast(1.1) saturate(1.2)'
              : 'brightness(1.0) contrast(1.05) saturate(1.1) opacity(0.5)',
            transform: 'scale(1.02)',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />
      )}

      {/* 3. High-Vibrancy Chromatic Shimmer Screen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.18) 0%, transparent 65%), radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.15) 0%, transparent 55%)'
            : 'radial-gradient(circle at 50% 40%, rgba(192, 132, 252, 0.12) 0%, transparent 65%), radial-gradient(circle at 85% 75%, rgba(251, 146, 60, 0.1) 0%, transparent 55%)',
        }}
      />
    </div>
  );
};

