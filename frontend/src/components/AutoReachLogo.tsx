import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  layout?: 'perched' | 'horizontal';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

// The exact golden yellow sampled directly from the user's origami bird wing (#EFC33E)
export const BIRD_YELLOW_HEX = '#EFC33E';

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  layout = 'perched',
  theme = 'auto',
  showBadge = false,
  className = '',
  onClick,
}) => {
  // Sizing configuration
  const sizeConfig = {
    xs: { birdW: 24, birdH: 23, offsetBottom: '-mb-1.5', textSize: 'text-xs', navBird: 'w-5 h-5 -mr-1 -mt-1' },
    sm: { birdW: 34, birdH: 33, offsetBottom: '-mb-2', textSize: 'text-base', navBird: 'w-7 h-7 -mr-1 -mt-1.5' },
    md: { birdW: 46, birdH: 44, offsetBottom: '-mb-3', textSize: 'text-xl', navBird: 'w-9 h-9 -mr-1.5 -mt-2' },
    lg: { birdW: 68, birdH: 66, offsetBottom: '-mb-4', textSize: 'text-3xl', navBird: 'w-14 h-14 -mr-2 -mt-3' },
    xl: { birdW: 96, birdH: 93, offsetBottom: '-mb-6', textSize: 'text-5xl', navBird: 'w-20 h-20 -mr-3 -mt-4' },
  };

  const current = typeof size === 'number'
    ? { birdW: size, birdH: Math.round(size * 0.97), offsetBottom: '-mb-2', textSize: 'text-base', navBird: 'w-7 h-7 -mr-1 -mt-1' }
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
      <span className={`font-extrabold tracking-tight ${current.textSize} ${autoTextColor} ${className}`}>
        Auto<span style={{ color: BIRD_YELLOW_HEX }}>Reach</span>
      </span>
    );
  }

  // PERCHED LAYOUT: Bird resting on top of the head of 'A' in AutoReach
  if (layout === 'perched') {
    return (
      <div
        className={`relative inline-flex flex-col items-start select-none ${
          onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
        } ${className}`}
        onClick={onClick}
      >
        {/* Bird perched so bottom tip lands directly on the apex of 'A' */}
        <div
          className={`relative ${current.offsetBottom} ml-0.5 shrink-0 z-10`}
          style={{ width: current.birdW, height: current.birdH }}
        >
          <img
            src={iconSrc}
            alt="AutoReach Origami Bird"
            className="w-full h-full object-contain filter drop-shadow-xs"
            draggable={false}
          />
        </div>

        {/* Wordmark AutoReach underneath bird */}
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight leading-none ${current.textSize} ${autoTextColor}`}>
            Auto<span style={{ color: BIRD_YELLOW_HEX }}>Reach</span>
          </span>

          {showBadge && (
            <span
              className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase"
              style={{
                backgroundColor: 'rgba(239, 195, 62, 0.15)',
                color: BIRD_YELLOW_HEX,
                borderColor: 'rgba(239, 195, 62, 0.35)',
              }}
            >
              v5.0 Live
            </span>
          )}
        </div>
      </div>
    );
  }

  // HORIZONTAL LAYOUT (Bird slightly elevated on left with tail swooping into 'A')
  return (
    <div
      className={`inline-flex items-center select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div
        className={`relative ${current.navBird} shrink-0 z-10 flex items-center justify-center`}
        style={{ width: current.birdW, height: current.birdH }}
      >
        <img
          src={iconSrc}
          alt="AutoReach Origami Bird"
          className="w-full h-full object-contain filter drop-shadow-xs"
          draggable={false}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className={`font-black tracking-tight ${current.textSize} ${autoTextColor}`}>
          Auto<span style={{ color: BIRD_YELLOW_HEX }}>Reach</span>
        </span>

        {showBadge && (
          <span
            className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase"
            style={{
              backgroundColor: 'rgba(239, 195, 62, 0.15)',
              color: BIRD_YELLOW_HEX,
              borderColor: 'rgba(239, 195, 62, 0.35)',
            }}
          >
            v5.0 Live
          </span>
        )}
      </div>
    </div>
  );
};
