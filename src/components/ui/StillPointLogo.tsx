import React from 'react';

export interface StillPointLogoProps {
  /** Size in pixels or preset string */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Visual variation of the arch */
  variant?: 'portal' | 'solid' | 'minimal';
  /** Primary color for arch and baseline (defaults to Bark #26302A or Moss #5E6F63) */
  color?: string;
  /** Eye outline color */
  eyeColor?: string;
  /** Center iris dot color (defaults to Clay #C58A66) */
  irisColor?: string;
  /** Whether to show the "STILL POINT" text next to the mark */
  showWordmark?: boolean;
  /** Subtitle below STILL POINT when wordmark is enabled */
  subtitle?: string;
  /** Direction when wordmark is displayed */
  layout?: 'horizontal' | 'vertical';
  /** Additional container CSS class */
  className?: string;
  /** Additional SVG CSS class */
  svgClassName?: string;
  /** Additional wordmark text CSS class */
  wordmarkClassName?: string;
}

const SIZE_MAP = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

export function StillPointLogo({
  size = 'md',
  variant = 'portal',
  color = '#26302A',
  eyeColor,
  irisColor = '#C58A66',
  showWordmark = false,
  subtitle,
  layout = 'horizontal',
  className = '',
  svgClassName = '',
  wordmarkClassName = '',
}: StillPointLogoProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 36;
  const resolvedEyeColor = eyeColor || (variant === 'solid' ? '#F6F4EF' : color);

  const svgContent = (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-200 ${svgClassName}`}
      aria-label="STILL POINT logo mark"
      role="img"
    >
      {/* Horizontal Baseline */}
      <line
        x1="14"
        y1="82"
        x2="86"
        y2="82"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {variant === 'solid' && (
        /* Filled Solid Arch Silhouette with Eye Opening */
        <path
          d="M 24 82 V 46 A 26 26 0 0 1 76 46 V 82 Z"
          fill={color}
        />
      )}

      {variant === 'portal' && (
        /* Architectural Portal Archway (vaulted frame) */
        <path
          d="M 23 82 V 46 A 27 27 0 0 1 77 46 V 82 H 68 V 46 A 18 18 0 0 0 32 46 V 82 Z"
          fill={color}
          fillRule="evenodd"
        />
      )}

      {variant === 'minimal' && (
        /* Minimalist Outline Arch */
        <path
          d="M 26 82 V 46 A 24 24 0 0 1 74 46 V 82"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {/* Internal Eye / Oval Silhouette */}
      <path
        d="M 34 49 C 39 40 61 40 66 49 C 61 58 39 58 34 49 Z"
        stroke={resolvedEyeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={variant === 'solid' ? '#F6F4EF' : 'none'}
      />

      {/* Warm Clay Iris Dot — The Still Point */}
      <circle
        cx="50"
        cy="49"
        r="4.2"
        fill={irisColor}
      />

      {/* Subtle Inner Reflection Point */}
      <circle
        cx="51.2"
        cy="47.8"
        r="1"
        fill="#FFFFFF"
        opacity="0.8"
      />
    </svg>
  );

  if (!showWordmark) {
    return svgContent;
  }

  return (
    <div
      className={`inline-flex ${
        layout === 'vertical' ? 'flex-col items-center text-center gap-2' : 'items-center gap-3'
      } ${className}`}
    >
      {svgContent}
      <div className={`flex flex-col ${wordmarkClassName}`}>
        <span
          className="font-serif font-bold tracking-[0.22em] uppercase leading-none text-[#26302A]"
          style={{ fontSize: `${Math.max(13, Math.round(pixelSize * 0.42))}px` }}
        >
          STILL POINT
        </span>
        {subtitle && (
          <span
            className="font-sans tracking-[0.26em] uppercase text-[#5E6F63] font-medium mt-1 leading-tight"
            style={{ fontSize: `${Math.max(8, Math.round(pixelSize * 0.2))}px` }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default StillPointLogo;
