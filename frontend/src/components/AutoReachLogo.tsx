import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

// The exact vibrant warm amber gold sampled from the user's AR squircle background (#FFB900)
export const BIRD_COLOR_HEX = '#FFB900';

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showBadge = false,
  className = '',
  onClick,
}) => {
  // Option 02 Lockup Geometry:
  // - The bird is BIG and hovers in the air above "Auto"
  // - Tail is down-left of "Auto" with clear horizontal air space
  // - Belly is above "Auto" with clear vertical air space (NO CONTACT!)
  // - Head and beak reach over "uto" towards "Reach"
  // - "Reach" is colored #FFB900 matching the AR badge background
  const sizeConfig = {
    xs: { birdW: 42, birdH: 40, textLeft: 19, textTop: 32, fontSize: 12, totalW: 110, totalH: 46 },
    sm: { birdW: 52, birdH: 50, textLeft: 23, textTop: 38, fontSize: 15, totalW: 135, totalH: 56 },
    md: { birdW: 76, birdH: 73, textLeft: 35, textTop: 58, fontSize: 20, totalW: 175, totalH: 80 },
    lg: { birdW: 104, birdH: 101, textLeft: 47, textTop: 80, fontSize: 26, totalW: 230, totalH: 110 },
    xl: { birdW: 148, birdH: 143, textLeft: 67, textTop: 114, fontSize: 37, totalW: 320, totalH: 155 },
  };

  const current = typeof size === 'number'
    ? {
        birdW: size,
        birdH: Math.round(size * 0.969),
        textLeft: Math.round(size * 0.45),
        textTop: Math.round(size * 0.77),
        fontSize: Math.max(11, Math.round(size * 0.26)),
        totalW: Math.round(size * 2.15),
        totalH: Math.round(size * 1.05),
      }
    : sizeConfig[size] || sizeConfig.sm;

  // Adaptive bird asset depending on theme
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
        style={{ width: current.birdW, height: current.birdH }}
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
        className={`font-black tracking-tight leading-none ${autoTextColor} ${className}`}
        style={{ fontSize: current.fontSize }}
      >
        Auto<span style={{ color: BIRD_COLOR_HEX }}>Reach</span>
      </span>
    );
  }

  // OPTION 02 FULL BRAND LOCKUP:
  // Soaring bird in the air hovering over "Auto" with guaranteed air gap
  const containerW = showBadge ? current.totalW + 55 : current.totalW;

  return (
    <div
      className={`relative inline-block select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      style={{ width: containerW, height: current.totalH }}
      onClick={onClick}
    >
      {/* 1. Big Origami Bird hovering in the air */}
      <img
        src={iconSrc}
        alt="AutoReach Origami Bird"
        className="absolute top-0 left-0 object-contain z-10"
        style={{
          width: current.birdW,
          height: current.birdH,
        }}
        draggable={false}
      />

      {/* 2. Wordmark nestled under bird with zero contact and visible air gap */}
      <div
        className="absolute flex items-center gap-1.5 whitespace-nowrap z-20"
        style={{
          left: current.textLeft,
          top: current.textTop,
        }}
      >
        <span
          className={`font-black tracking-tight leading-none ${autoTextColor}`}
          style={{ fontSize: current.fontSize }}
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
