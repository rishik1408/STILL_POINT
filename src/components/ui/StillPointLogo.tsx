import React from 'react';

export interface StillPointLogoProps {
  /** Size in pixels (height of the logo) or preset string */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | number;
  /** Whether to show the full mark + STILL POINT wordmark or just the eye mark */
  variant?: 'full' | 'mark' | 'text';
  /** Whether the background is dark (uses the light stone letters on dark surfaces) */
  inverted?: boolean;
  /** Optional subtitle below STILL POINT when wordmark is enabled */
  subtitle?: string;
  /** Backward compatibility with previous layout prop */
  layout?: 'horizontal' | 'vertical';
  /** Backward compatibility with showWordmark prop */
  showWordmark?: boolean;
  /** Additional container CSS class */
  className?: string;
  /** Additional image CSS class */
  imageClassName?: string;
  /** Optional fallback styling overrides */
  color?: string;
  eyeColor?: string;
  irisColor?: string;
}

const HEIGHT_MAP: Record<string, number> = {
  xs: 24,
  sm: 34,
  md: 46,
  lg: 64,
  xl: 92,
  hero: 130,
};

export function StillPointLogo({
  size = 'md',
  variant,
  inverted = false,
  subtitle,
  showWordmark = true,
  className = '',
  imageClassName = '',
}: StillPointLogoProps) {
  const pixelHeight = typeof size === 'number' ? size : HEIGHT_MAP[size] || 46;

  // Resolve which graphic variant to use
  const isMarkOnly = variant === 'mark' || showWordmark === false;

  const imageSrc = isMarkOnly
    ? inverted
      ? '/still-point-mark-light.png'
      : '/still-point-mark.png'
    : inverted
    ? '/still-point-full-light.png'
    : '/still-point-full.png';

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <img
        src={imageSrc}
        alt="STILL POINT"
        style={{ height: `${pixelHeight}px`, width: 'auto' }}
        className={`object-contain shrink-0 transition-opacity duration-200 ${imageClassName}`}
        loading="eager"
      />
      {subtitle && (
        <span
          className={`font-sans tracking-[0.22em] uppercase font-medium mt-1 leading-tight text-center ${
            inverted ? 'text-[#A3AD9C]' : 'text-[#5E6F63]'
          }`}
          style={{ fontSize: `${Math.max(9, Math.round(pixelHeight * 0.16))}px` }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default StillPointLogo;
