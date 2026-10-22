import React, { useEffect, useState } from 'react';

interface BackgroundRibbonsProps {
  opacity?: number;
  brightness?: number;
  isDark?: boolean;
}

/**
 * 4 large abstract, colorful liquid-light ribbons using colors:
 * #5B2EFF, #7C3AED, #8B5CF6, #A855F7, #D946EF, #EC4899, #F472B6, #FF7A18
 * Using absolute positioning, CSS keyframe animations for slow movement (24s duration),
 * and Gaussian blur for a glossy silk effect.
 * Automatically disables animations for users who prefer reduced motion.
 */
export const BackgroundRibbons: React.FC<BackgroundRibbonsProps> = ({
  opacity = 1.0,
  brightness = 1.0,
  isDark = true,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024));
    };
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => {
        mediaQuery.removeEventListener('change', listener);
        window.removeEventListener('resize', checkViewport);
      };
    } else {
      // Legacy fallback
      mediaQuery.addListener(listener);
      return () => {
        mediaQuery.removeListener(listener);
        window.removeEventListener('resize', checkViewport);
      };
    }
  }, []);

  // Adaptive blur radius: mobile devices use 30px to save GPU fill rate and guarantee 60 FPS
  const blurBase = isMobile ? 32 : 75;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
      style={{
        opacity,
        filter: `brightness(${brightness})`,
        contain: 'strict',
      }}
      aria-hidden="true"
    >
      {/* Container for the 4 large liquid-light silk ribbons */}
      <div className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transform-gpu will-change-transform">
        {/* Ribbon 1: Electric Violet to Indigo Silk Wave (Top-Left diagonal drift) */}
        <div
          className={`absolute top-[-10%] left-[-10%] w-[85vw] h-[55vh] rounded-[100%] pointer-events-none ${
            prefersReducedMotion ? '' : 'animate-ribbon-one'
          }`}
          style={{
            background:
              'linear-gradient(135deg, rgba(91, 46, 255, 0.85) 0%, rgba(124, 58, 237, 0.75) 40%, rgba(139, 92, 246, 0.45) 75%, transparent 100%)',
            filter: `blur(${blurBase}px)`,
            transform: 'rotate(-25deg) translate3d(0, 0, 0)',
            willChange: prefersReducedMotion ? 'auto' : 'transform',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />

        {/* Ribbon 2: Vivid Fuchsia to Magenta Liquid Arc (Top-Right flowing wave) */}
        <div
          className={`absolute top-[5%] right-[-15%] w-[90vw] h-[60vh] rounded-[90px] pointer-events-none ${
            prefersReducedMotion ? '' : 'animate-ribbon-two'
          }`}
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.8) 0%, rgba(236, 72, 153, 0.65) 45%, rgba(168, 85, 247, 0.35) 75%, transparent 100%)',
            filter: `blur(${blurBase + 5}px)`,
            transform: 'rotate(20deg) translate3d(0, 0, 0)',
            willChange: prefersReducedMotion ? 'auto' : 'transform',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />

        {/* Ribbon 3: Rose Pink to Sunset Amber Warm Ribbon (Bottom-Left sweep) */}
        <div
          className={`absolute bottom-[-10%] left-[-5%] w-[95vw] h-[55vh] rounded-[120px] pointer-events-none ${
            prefersReducedMotion ? '' : 'animate-ribbon-three'
          }`}
          style={{
            background:
              'linear-gradient(45deg, rgba(255, 122, 24, 0.8) 0%, rgba(244, 114, 182, 0.7) 45%, rgba(236, 72, 153, 0.4) 80%, transparent 100%)',
            filter: `blur(${blurBase}px)`,
            transform: 'rotate(15deg) translate3d(0, 0, 0)',
            willChange: prefersReducedMotion ? 'auto' : 'transform',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />

        {/* Ribbon 4: Prismatic Violet & Royal Indigo Undercurrent (Bottom-Right rise) */}
        <div
          className={`absolute bottom-[10%] right-[-10%] w-[80vw] h-[50vh] rounded-[100%] pointer-events-none ${
            prefersReducedMotion ? '' : 'animate-ribbon-four'
          }`}
          style={{
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.75) 0%, rgba(124, 58, 237, 0.6) 45%, rgba(91, 46, 255, 0.3) 75%, transparent 100%)',
            filter: `blur(${blurBase + 8}px)`,
            transform: 'rotate(-15deg) translate3d(0, 0, 0)',
            willChange: prefersReducedMotion ? 'auto' : 'transform',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />
      </div>

      {/* Glossy Silk Micro-Luster Overlay for high-end sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 50% 30%, rgba(236, 72, 153, 0.08) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(255, 122, 24, 0.06) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
