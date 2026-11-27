import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

// The exact vibrant warm yellow/orange sampled from the AR background (#FFB900)
export const BIRD_COLOR_HEX = '#FFB900';

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showBadge = false,
  className = '',
  onClick,
}) => {
  // Sizing configuration:
  // Option 02 layout where the bird is big and spans across the length of 'Auto',
  // with the tail down-left and the body bending over 'Auto'
  const sizeConfig = {
    xs: { birdW: 42, birdH: 40, ml: '-ml-[21px]', mb: 'mb-[1px]', textSize: 'text-xs' },
    sm: { birdW: 56, birdH: 54, ml: '-ml-[28px]', mb: 'mb-[2px]', textSize: 'text-[17px]' },
    md: { birdW: 76, birdH: 73, ml: '-ml-[38px]', mb: 'mb-[3px]', textSize: 'text-xl' },
    lg: { birdW: 110, birdH: 106, ml: '-ml-[55px]', mb: 'mb-[5px]', textSize: 'text-3xl' },
    xl: { birdW: 154, birdH: 149, ml: '-ml-[77px]', mb: 'mb-[8px]', textSize: 'text-5xl' },
  };

  const current = typeof size === 'number'
    ? {
        birdW: size,
        birdH: Math.round(size * 0.97),
        ml: `-ml-[${Math.round(size * 0.50)}px]`,
        mb: 'mb-[2px]',
        textSize: 'text-base',
      }
    : sizeConfig[size] || sizeConfig.sm;

  // Adaptive icon depending on theme
  const iconSrc =
    theme === 'dark'
      ? '/origami_bird_darkmode.png'
      : theme === 'light'
      ? '/origami_bird_transparent.png'
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
      <span className={`font-black tracking-tight ${current.textSize} ${autoTextColor} ${className}`}>
        Auto<span style={{ color: BIRD_COLOR_HEX }}>Reach</span>
      </span>
    );
  }

  // OPTION 02 LOCKUP:
  // The bird is big and spans across the length of 'Auto',
  // with the tail down-left and the body bending over 'Auto'
  return (
    <div
      className={`inline-flex items-end select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Big Origami Bird spanning over Auto */}
      <img
        src={iconSrc}
        alt="AutoReach Origami Bird"
        style={{ width: current.birdW, height: current.birdH }}
        className="shrink-0 object-contain z-10"
        draggable={false}
      />

      {/* Wordmark AutoReach nestled under bird */}
      <div
        className={`flex items-center gap-2 whitespace-nowrap z-20 ${current.ml} ${current.mb}`}
      >
        <span className={`font-black tracking-tight leading-none ${current.textSize} ${autoTextColor}`}>
          Auto<span style={{ color: BIRD_COLOR_HEX }}>Reach</span>
        </span>

        {showBadge && (
          <span
            className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase"
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
    </div>
  );
};
