import React from 'react';

export interface AutoReachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'dark' | 'light' | 'auto';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AutoReachLogo: React.FC<AutoReachLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showBadge = false,
  className = '',
  onClick,
}) => {
  // Dimension mapping
  const sizeMap: Record<string, { iconSize: number; textSize: string; gap: string }> = {
    xs: { iconSize: 20, textSize: 'text-sm', gap: 'gap-1.5' },
    sm: { iconSize: 28, textSize: 'text-base', gap: 'gap-2' },
    md: { iconSize: 34, textSize: 'text-lg', gap: 'gap-2.5' },
    lg: { iconSize: 46, textSize: 'text-2xl', gap: 'gap-3' },
    xl: { iconSize: 64, textSize: 'text-4xl', gap: 'gap-4' },
  };

  const currentSize = typeof size === 'number'
    ? { iconSize: size, textSize: 'text-base', gap: 'gap-2' }
    : sizeMap[size] || sizeMap.md;

  // Use dark-mode keylined bird on dark surfaces, transparent bird on light
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

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Origami Bird Symbol */}
      {variant !== 'wordmark' && (
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
        >
          <img
            src={iconSrc}
            alt="AutoReach Origami Bird"
            className="w-full h-full object-contain filter drop-shadow-xs"
            draggable={false}
          />
        </div>
      )}

      {/* Two-tone Wordmark */}
      {variant !== 'icon' && (
        <div className="flex items-center gap-2">
          <span className={`font-extrabold tracking-tight ${currentSize.textSize} ${autoTextColor}`}>
            Auto<span className="text-amber-500">Reach</span>
          </span>

          {showBadge && (
            <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300/80 tracking-wide">
              v5.0 Live
            </span>
          )}
        </div>
      )}
    </div>
  );
};
