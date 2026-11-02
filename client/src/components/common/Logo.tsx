import React from 'react';

export interface LogoProps {
  /**
   * Theme variant:
   * - 'light': Dark text for white/light backgrounds (default)
   * - 'dark': White text with glowing green for dark slate/black backgrounds
   * - 'auto': Uses currentColor / Tailwind classes where applicable
   */
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  alt?: string;
  showTagline?: boolean;
  iconOnly?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  className = 'h-8 w-auto',
  alt = 'SaveBite - Food Deals',
  showTagline = true,
  iconOnly = false,
  onClick,
}) => {
  const isDark = variant === 'dark';

  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 40 40"
        fill="none"
        className={className}
        role="img"
        aria-label={alt}
        onClick={onClick}
      >
        <g transform="translate(4, 4)">
          <rect width="32" height="32" rx="10" fill="#1b7a43" />
          <path
            d="M16 8C11.5817 8 8 11.5817 8 16C8 22 16 26 16 26C16 26 24 22 24 16C24 11.5817 20.4183 8 16 8Z"
            fill="#a7f3d0"
            opacity="0.4"
          />
          <path
            d="M12 15C12 13.5 13.5 12 16 12C18.5 12 20 13.5 20 15C20 18 16 21 16 21C16 21 12 18 12 15Z"
            fill="#ffffff"
          />
          <circle cx="16" cy="15" r="1.5" fill="#1b7a43" />
          <path
            d="M21 9C23 10.5 24 13 24 16"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 40"
      fill="none"
      className={className}
      role="img"
      aria-label={alt}
      onClick={onClick}
    >
      {/* Icon Badge */}
      <g transform="translate(4, 4)">
        <rect width="32" height="32" rx="10" fill="#1b7a43" />
        <path
          d="M16 8C11.5817 8 8 11.5817 8 16C8 22 16 26 16 26C16 26 24 22 24 16C24 11.5817 20.4183 8 16 8Z"
          fill="#a7f3d0"
          opacity="0.4"
        />
        <path
          d="M12 15C12 13.5 13.5 12 16 12C18.5 12 20 13.5 20 15C20 18 16 21 16 21C16 21 12 18 12 15Z"
          fill="#ffffff"
        />
        <circle cx="16" cy="15" r="1.5" fill="#1b7a43" />
        <path
          d="M21 9C23 10.5 24 13 24 16"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* SaveBite Brand Name */}
      <text
        x="44"
        y={showTagline ? 24 : 26}
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="16"
        fill={isDark ? '#ffffff' : '#0f172a'}
        letterSpacing="-0.02em"
      >
        Save<tspan fill={isDark ? '#34d399' : '#1b7a43'}>Bite</tspan>
      </text>

      {/* FOOD DEALS Tagline */}
      {showTagline && (
        <text
          x="44"
          y="32"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="600"
          fontSize="8"
          fill={isDark ? '#94a3b8' : '#64748b'}
          letterSpacing="0.06em"
        >
          FOOD DEALS
        </text>
      )}
    </svg>
  );
};

export default Logo;
