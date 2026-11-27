import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  iconType?: 'first' | 'dove';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

// The exact vibrant warm amber gold sampled from the AR badge (#FFB900)
export const BIRD_COLOR_HEX = '#FFB900';

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  iconType = 'first',
  theme = 'auto',
  showBadge = false,
  className = '',
  onClick,
}) => {
  // Horizontal Lockup Geometry:
  // - First image (the bird logo icon) on the left
  // - Followed by "AutoReach" on the EXACT SAME horizontal level
  // - Clean vertical alignment, zero overlap, proportional sizing
  const sizeConfig = {
    xs: { iconSize: 22, textSize: 'text-xs', gap: 'gap-1.5' },
    sm: { iconSize: 32, textSize: 'text-[17px]', gap: 'gap-2.5' },
    md: { iconSize: 42, textSize: 'text-2xl', gap: 'gap-3' },
    lg: { iconSize: 58, textSize: 'text-3xl', gap: 'gap-3.5' },
    xl: { iconSize: 76, textSize: 'text-5xl', gap: 'gap-4' },
  };

  const current = typeof size === 'number'
    ? {
        iconSize: size,
        textSize: 'text-base',
        gap: 'gap-2.5',
      }
    : sizeConfig[size] || sizeConfig.sm;

  // Determine icon source based on iconType ('first' vs 'dove') and theme
  const getIconSrc = () => {
    if (iconType === 'dove') {
      return theme === 'dark'
        ? '/origami_bird_darkmode.png'
        : '/origami_bird_transparent.png';
    }
    // Default: 'first' (the geometric origami hummingbird from user's first image)
    return theme === 'dark'
      ? '/origami_bird_first_darkmode.png'
      : '/origami_bird_first.png';
  };

  const iconSrc = getIconSrc();

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
  // First image followed by AutoReach on the exact same horizontal level
  return (
    <div
      className={`inline-flex items-center ${current.gap} select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* 1. First Image (Bird Mark) */}
      <img
        src={iconSrc}
        alt="AutoReach Bird Logo"
        style={{ width: current.iconSize, height: current.iconSize }}
        className="shrink-0 object-contain"
        draggable={false}
      />

      {/* 2. Followed by AutoReach on the same level */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span
          className={`font-black tracking-tight leading-none ${current.textSize} ${autoTextColor}`}
        >
          Auto<span style={{ color: BIRD_COLOR_HEX }}>Reach</span>
        </span>

        {showBadge && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border tracking-wide uppercase shrink-0"
            style={{
              backgroundColor: 'rgba(255, 185, 0, 0.15)',
              color: '#D97706',
              borderColor: 'rgba(255, 185, 0, 0.4)',
            }}
          >
            v5.0
          </span>
        )}
      </div>
    </div>
  );
};
