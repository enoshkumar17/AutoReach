import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

// Warm, high-contrast yellowish-orange (#F58220) for maximum visibility on white & dark surfaces
export const BIRD_ORANGE_HEX = '#F58220';

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showBadge = false,
  className = '',
  onClick,
}) => {
  // Sizing configuration calibrated to the Option 02 tucked lockup
  const sizeConfig = {
    xs: { birdW: 34, birdH: 33, ml: '-ml-[18px]', mb: 'mb-[2px]', textSize: 'text-sm' },
    sm: { birdW: 46, birdH: 44, ml: '-ml-[24px]', mb: 'mb-[3px]', textSize: 'text-[17px]' },
    md: { birdW: 60, birdH: 58, ml: '-ml-[31px]', mb: 'mb-[5px]', textSize: 'text-xl' },
    lg: { birdW: 86, birdH: 83, ml: '-ml-[45px]', mb: 'mb-[7px]', textSize: 'text-3xl' },
    xl: { birdW: 126, birdH: 122, ml: '-ml-[66px]', mb: 'mb-[10px]', textSize: 'text-5xl' },
  };

  const current = typeof size === 'number'
    ? {
        birdW: size,
        birdH: Math.round(size * 0.97),
        ml: `-ml-[${Math.round(size * 0.52)}px]`,
        mb: 'mb-[3px]',
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
        Auto<span style={{ color: BIRD_ORANGE_HEX }}>Reach</span>
      </span>
    );
  }

  // TUCKED LOCKUP (Option 02 layout):
  // The bird's tail angles down-left, with the letter 'A' in AutoReach tucked directly under the bird's belly
  return (
    <div
      className={`inline-flex items-end select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Origami Bird */}
      <img
        src={iconSrc}
        alt="AutoReach Origami Bird"
        style={{ width: current.birdW, height: current.birdH }}
        className="shrink-0 object-contain z-10"
        draggable={false}
      />

      {/* Tucked Wordmark AutoReach */}
      <div
        className={`flex items-center gap-2 whitespace-nowrap z-20 ${current.ml} ${current.mb}`}
      >
        <span className={`font-black tracking-tight leading-none ${current.textSize} ${autoTextColor}`}>
          Auto<span style={{ color: BIRD_ORANGE_HEX }}>Reach</span>
        </span>

        {showBadge && (
          <span
            className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase"
            style={{
              backgroundColor: 'rgba(245, 130, 32, 0.12)',
              color: BIRD_ORANGE_HEX,
              borderColor: 'rgba(245, 130, 32, 0.35)',
            }}
          >
            v5.0 Live
          </span>
        )}
      </div>
    </div>
  );
};
