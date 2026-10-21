import React from 'react';

interface SparkLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Premium, high-definition SparkMind Logo.
 * Features an immaculate, luminous 4-pointed celestial crystal spark:
 * - Ultra-vibrant gradient (Electric Violet -> Neon Magenta -> Vivid Sunset Amber -> Pure Diamond White)
 * - Multi-layered refractive facets for depth and high brightness
 * - Radiant chromatic glow and micro-star accents
 */
export const SparkLogo: React.FC<SparkLogoProps> = ({
  className = 'h-5 w-5',
  size = 24,
  glow = true,
}) => {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none overflow-visible ${className}`}
      aria-label="SparkMind Logo"
    >
      <defs>
        {/* Primary Vibrant Cosmic Gradient: Violet -> Fuchsia -> Amber -> Gold */}
        <linearGradient
          id={`sparkGradPrime-${uniqueId}`}
          x1="8"
          y1="8"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A855F7" />   {/* Radiant Purple */}
          <stop offset="30%" stopColor="#EC4899" />  {/* Hot Pink / Magenta */}
          <stop offset="65%" stopColor="#F97316" />  {/* Vivid Orange */}
          <stop offset="100%" stopColor="#FBBF24" /> {/* Bright Gold */}
        </linearGradient>

        {/* Vertical Light Flare Gradient */}
        <linearGradient
          id={`sparkGradVert-${uniqueId}`}
          x1="32"
          y1="4"
          x2="32"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="20%" stopColor="#F472B6" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#FB923C" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#C084FC" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
        </linearGradient>

        {/* Diagonal Crystal Facet */}
        <linearGradient
          id={`sparkGradFacet-${uniqueId}`}
          x1="18"
          y1="18"
          x2="46"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FDE047" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.3" />
        </linearGradient>

        {/* High-Brightness Glow Filter */}
        {glow && (
          <filter id={`sparkGlow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur1" />
            <feGaussianBlur stdDeviation="1" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Radiant ambient colored auras behind the star */}
      {glow && (
        <>
          <circle
            cx="32"
            cy="32"
            r="22"
            fill={`url(#sparkGradPrime-${uniqueId})`}
            opacity="0.35"
            className="animate-pulse"
          />
          <circle
            cx="32"
            cy="32"
            r="14"
            fill="#F43F5E"
            opacity="0.3"
            filter={`url(#sparkGlow-${uniqueId})`}
          />
        </>
      )}

      {/* 4-Pointed Outer Celestial Halo Star */}
      <path
        d="M32 4C32 19.464 19.464 32 4 32C19.464 32 32 44.536 32 60C32 44.536 44.536 32 60 32C44.536 32 32 19.464 32 4Z"
        fill={`url(#sparkGradPrime-${uniqueId})`}
        filter={glow ? `url(#sparkGlow-${uniqueId})` : undefined}
      />

      {/* Secondary Dynamic Diamond Cross Layer (45-degree angled flare for brilliance) */}
      <path
        d="M32 12C32 23.0457 23.0457 32 12 32C23.0457 32 32 40.9543 32 52C32 40.9543 40.9543 32 52 32C40.9543 32 32 23.0457 32 12Z"
        fill={`url(#sparkGradVert-${uniqueId})`}
        opacity="0.85"
      />

      {/* Inner Crystal Facet Prism */}
      <path
        d="M32 16C32 24.8366 24.8366 32 16 32C24.8366 32 32 39.1634 32 48C32 39.1634 39.1634 32 48 32C39.1634 32 32 24.8366 32 16Z"
        fill={`url(#sparkGradFacet-${uniqueId})`}
      />

      {/* Brilliant Diamond Center Flare Core */}
      <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
      <circle cx="32" cy="32" r="3" fill="#FEF08A" />

      {/* Top-Right Satellite Micro Spark */}
      <path
        d="M51 9C51 13.4183 47.4183 17 43 17C47.4183 17 51 20.5817 51 25C51 20.5817 54.5817 17 59 17C54.5817 17 51 13.4183 51 9Z"
        fill="#FDE047"
        opacity="0.95"
      />

      {/* Bottom-Left Micro Accent Spark */}
      <path
        d="M13 46C13 48.7614 10.7614 51 8 51C10.7614 51 13 53.2386 13 56C13 53.2386 15.2386 51 18 51C15.2386 51 13 48.7614 13 46Z"
        fill="#EC4899"
        opacity="0.8"
      />
    </svg>
  );
};
