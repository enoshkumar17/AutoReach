import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

// The exact vibrant warm amber gold sampled from the AR badge (#FFB900)
export const BIRD_COLOR_HEX = '#FFB900';

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showBadge = false,
  subtitle,
  className = '',
  onClick,
}) => {
  // Horizontal Lockup Geometry:
  // - THIS BIRD ONLY: The Origami Dove (/origami_bird_transparent.png and /origami_bird_darkmode.png)
  // - Bird on the left, followed immediately by AutoReach on the EXACT SAME HORIZONTAL LINE
  // - Perfectly aligned, vertically centered, zero contact/overlap
  const sizeConfig = {
    xs: { iconSize: 28, textSize: 'text-xs', gap: 'gap-2' },
    sm: { iconSize: 44, textSize: 'text-[18px]', gap: 'gap-3' },
    md: { iconSize: 58, textSize: 'text-2xl', gap: 'gap-3.5' },
    lg: { iconSize: 76, textSize: 'text-3xl', gap: 'gap-4' },
    xl: { iconSize: 104, textSize: 'text-5xl', gap: 'gap-5' },
  };

  const current = typeof size === 'number'
    ? {
        iconSize: size,
        textSize: 'text-base',
        gap: 'gap-2.5',
      }
    : sizeConfig[size] || sizeConfig.sm;

  // Adaptive icon depending on theme
  const iconSrc =
    theme === 'dark'
      ? '/origami_bird_darkmode.png'
      : '/origami_bird_transparent.png';

  const autoTextColor =
    theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-stone-900'
      : 'text-stone-900 dark:text-white';

  // If icon-only
  if (variant === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
        style={{ width: current.iconSize, height: current.iconSize }}
        onClick={onClick}
      >
        <img
          src={iconSrc}
          alt="AutoReach Bird"
          className="w-full h-full object-contain filter drop-shadow-xs"
          draggable={false}
        />
      </div>
    );
  }

  // If wordmark-only
  if (variant === 'wordmark') {
    return (
      <span
        className={`font-black tracking-tight leading-none ${current.textSize} ${autoTextColor} ${className}`}
      >
        Auto<span style={{ color: BIRD_COLOR_HEX }}>Reach</span>
      </span>
    );
  }

  // PERFECT HORIZONTAL LOCKUP:
  // Origami Dove Bird on the left, AutoReach on the same horizontal line
  return (
    <div
      className={`inline-flex items-center ${current.gap} select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* 1. Origami Dove Bird Mark */}
      <img
        src={iconSrc}
        alt="AutoReach Origami Bird"
        style={{ width: current.iconSize, height: current.iconSize }}
        className="shrink-0 object-contain"
        draggable={false}
      />

      {/* 2. AutoReach Wordmark on the same line */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span
            className={`font-black tracking-tight leading-none ${current.textSize} ${autoTextColor}`}
          >
            Auto<span style={{ color: BIRD_COLOR_HEX }}>Reach</span>
          </span>

          {showBadge && (
            <span
              className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border tracking-wide uppercase shrink-0"
              style={{
                backgroundColor: 'rgba(255, 185, 0, 0.15)',
                color: '#D97706',
                borderColor: 'rgba(255, 185, 0, 0.4)',
              }}
            >
              v5.0 Live
            </span>
          )}
        </div>

        {subtitle && (
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 tracking-tight mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
