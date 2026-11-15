import React from 'react';

/**
 * Hand-drawn SVG illustrations inspired by the peaceful, irregular,
 * cozy sketchbook ink-and-watercolor aesthetic.
 */

// 1. Hand Holding a Recipe / Opportunities Book with a Lemon & Bookmarks
export const DoodleRecipeBook: React.FC<{ className?: string }> = ({ className = 'w-28 h-28' }) => (
  <div className={`relative inline-block select-none ${className}`}>
    {/* Watercolor Blot Behind Book */}
    <div className="absolute -inset-2 bg-amber-300/60 rounded-[45%_55%_65%_35%/40%_60%_40%_60%] blur-[2px] -rotate-3 pointer-events-none" />
    
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-full drop-shadow-xs">
      {/* Hand Fingers Holding Book */}
      <path
        d="M 12 35 C 16 33, 22 34, 25 38 C 28 42, 26 48, 22 51 C 18 53, 14 52, 10 50"
        stroke="#1c1917"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 15 54 C 20 54, 24 57, 24 61 C 24 65, 20 67, 15 67 C 12 67, 10 65, 8 63"
        stroke="#1c1917"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Book Cover (Irregular hand-drawn rectangle) */}
      <path
        d="M 28 26 C 30 20, 68 14, 78 12 C 86 11, 89 16, 88 22 C 86 38, 92 84, 89 96 C 88 101, 80 106, 44 104 C 33 103, 29 98, 28 92 Z"
        fill="#fef9c3"
        stroke="#1c1917"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Book Spine / Pages Depth */}
      <path
        d="M 33 18 C 36 14, 70 8, 80 7 C 88 6, 92 10, 93 16 C 94 22, 92 92, 91 97"
        stroke="#1c1917"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M 36 21 L 42 16"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 44 22 L 50 17"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Little Doodle on the Cover (Lemon / Career Citrus) */}
      <path
        d="M 68 38 C 72 32, 79 36, 78 44 C 77 52, 69 58, 62 53 C 58 50, 60 41, 64 37 Z"
        fill="#fef08a"
        stroke="#1c1917"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Lemon Leaf */}
      <path
        d="M 69 35 C 72 30, 77 30, 78 32 C 78 35, 75 36, 71 36"
        stroke="#1c1917"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Tiny Eyes on Lemon */}
      <circle cx="68" cy="44" r="1.3" fill="#1c1917" />
      <circle cx="73" cy="43" r="1.3" fill="#1c1917" />

      {/* Hand-lettering: MY RECIPES / CAREERS */}
      <path
        d="M 46 62 L 48 70 L 51 64 L 54 70 L 56 62"
        stroke="#1c1917"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 59 62 L 62 67 L 62 71 M 65 62 L 62 67"
        stroke="#1c1917"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      <text
        x="37"
        y="83"
        fontFamily="'Patrick Hand', cursive, sans-serif"
        fontSize="11"
        fontWeight="bold"
        fill="#1c1917"
        letterSpacing="0.5"
      >
        OPPORTUNITIES
      </text>
    </svg>
  </div>
);

// 2. Kitchen Shelf with Mug, Cheese & Jar (Representing Structured Knowledge)
export const DoodleShelves: React.FC<{ className?: string }> = ({ className = 'w-32 h-20' }) => (
  <div className={`relative inline-block select-none ${className}`}>
    {/* Terracotta & Sage Watercolor blotches */}
    <div className="absolute top-1 left-2 w-12 h-10 bg-amber-200/60 rounded-[60%_40%_30%_70%/50%_60%_40%_50%] blur-[2px]" />
    <div className="absolute top-2 right-2 w-14 h-9 bg-emerald-200/50 rounded-[40%_60%_50%_50%/60%_30%_70%_40%] blur-[2px]" />

    <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-full">
      {/* Shelf Bar 1 (Hand-inked plank) */}
      <path
        d="M 12 50 C 35 48, 120 48, 148 50 L 148 55 C 120 54, 35 54, 12 56 Z"
        fill="#f5f5f4"
        stroke="#1c1917"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M 12 56 L 18 64 L 148 64 L 148 55" stroke="#1c1917" strokeWidth="2.5" fill="#e7e5e4" strokeLinejoin="round" />

      {/* Coffee / Tea Mug */}
      <path
        d="M 28 26 C 28 24, 48 24, 48 26 L 47 49 C 47 50, 29 50, 28 49 Z"
        fill="#ffffff"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Mug Handle */}
      <path
        d="M 28 30 C 20 30, 20 43, 28 44"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Measurement ticks on mug */}
      <path d="M 34 32 L 39 32 M 34 37 L 41 37 M 34 42 L 38 42" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />

      {/* Triangular Cheese Wedge / Tech Foundation */}
      <path
        d="M 64 49 L 75 28 L 94 38 L 94 49 Z"
        fill="#fef08a"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Cheese Holes */}
      <circle cx="76" cy="40" r="2" fill="#eab308" />
      <circle cx="86" cy="43" r="1.5" fill="#eab308" />
      <circle cx="83" cy="35" r="1.8" fill="#eab308" />

      {/* Small Jam / Spices Jar */}
      <path
        d="M 116 32 C 117 28, 134 28, 135 32 L 136 49 C 136 50, 115 50, 115 49 Z"
        fill="#ffffff"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Jar Lid */}
      <path d="M 118 28 C 120 25, 131 25, 133 28 Z" fill="#fecdd3" stroke="#1c1917" strokeWidth="2.2" />
      {/* Label on jar */}
      <path d="M 120 38 Q 126 36, 131 38" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </div>
);

// 3. Grocery / Applications Bag with Checklist ("LIST") & Fresh Goods
export const DoodleBagAndList: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => (
  <div className={`relative inline-block select-none ${className}`}>
    {/* Watercolor splashes */}
    <div className="absolute top-2 left-3 w-12 h-12 bg-emerald-200/60 rounded-[50%_50%_30%_70%/60%_40%_60%_40%] blur-[2px]" />
    <div className="absolute top-5 right-2 w-12 h-14 bg-orange-200/50 rounded-[40%_60%_60%_40%/50%_40%_60%_50%] blur-[2px]" />

    <svg viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-full">
      {/* Broccoli / Fresh Greens Peeking Out */}
      <path
        d="M 28 32 C 24 24, 35 15, 42 22 C 48 18, 54 26, 49 34 C 54 40, 44 47, 39 42 C 32 45, 25 39, 28 32 Z"
        fill="#bbf7d0"
        stroke="#1c1917"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M 38 42 L 40 58" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />

      {/* Milk Carton Peeking Out */}
      <path
        d="M 58 26 L 68 18 L 82 22 L 78 34 L 58 30 Z"
        fill="#fef3c7"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M 58 30 L 78 34 L 76 68 L 56 64 Z"
        fill="#ffffff"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Bottle with Cork */}
      <path
        d="M 94 36 C 94 30, 97 26, 97 20 L 102 20 C 102 26, 105 30, 105 36 L 106 65 L 93 65 Z"
        fill="#fed7aa"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M 97 18 L 102 18" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />

      {/* Main Tote Bag (Hand-drawn rounded trapezoid) */}
      <path
        d="M 35 56 C 45 54, 98 54, 108 58 C 112 75, 114 96, 110 112 C 108 116, 42 118, 32 114 C 28 98, 30 74, 35 56 Z"
        fill="#ffffff"
        stroke="#1c1917"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Heavy Ink Base on Bag */}
      <path
        d="M 32 102 C 50 100, 92 100, 110 102 L 109 112 C 90 116, 45 116, 32 114 Z"
        fill="#1c1917"
        stroke="#1c1917"
        strokeWidth="2"
      />

      {/* Bag Handle Loop */}
      <path
        d="M 54 58 C 54 84, 88 84, 88 58"
        stroke="#1c1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* The Checklist ("LIST") Sticking Out with Dots */}
      <path
        d="M 12 72 C 14 68, 34 69, 36 74 L 30 120 C 28 122, 10 120, 8 116 Z"
        fill="#fefce8"
        stroke="#1c1917"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <text
        x="13"
        y="83"
        fontFamily="'Patrick Hand', cursive, sans-serif"
        fontSize="9"
        fontWeight="bold"
        fill="#1c1917"
      >
        LIST
      </text>
      {/* Check Dots */}
      <circle cx="14" cy="90" r="1.3" fill="#1c1917" />
      <path d="M 18 90 L 28 90" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="96" r="1.3" fill="#1c1917" />
      <path d="M 18 96 L 27 96" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="102" r="1.3" fill="#1c1917" />
      <path d="M 18 102 L 28 102" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="108" r="1.3" fill="#1c1917" />
      <path d="M 18 108 L 26 108" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

// 4. Wavy Hand-Drawn Heading Underline
export const DoodleWavyUnderline: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-24 h-2.5',
  color = '#d97706',
}) => (
  <svg viewBox="0 0 100 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M 2 6 Q 14 0, 26 6 T 50 6 T 74 6 T 98 6"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

// 5. Hand-Drawn Curly Arrow with Arrowhead
export const DoodleArrow: React.FC<{ className?: string; color?: string; flip?: boolean }> = ({
  className = 'w-8 h-8',
  color = '#1c1917',
  flip = false,
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${flip ? '-scale-x-100' : ''}`}
  >
    <path
      d="M 6 12 C 14 6, 26 8, 28 18 C 29 25, 22 28, 18 32 C 16 34, 18 36, 26 35"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Arrowhead */}
    <path
      d="M 22 29 L 28 35 L 21 39"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 6. Hand-Drawn 4-Pointed Star Sparkle (✦)
export const DoodleStar: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-4 h-4',
  color = '#f59e0b',
}) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M 12 2 C 12 7, 17 12, 22 12 C 17 12, 12 17, 12 22 C 12 17, 7 12, 2 12 C 7 12, 12 7, 12 2 Z"
      fill={color}
      stroke="#1c1917"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// 7. Organic Watercolor Splash Backdrop
export const WatercolorBackdrop: React.FC<{
  color?: 'yellow' | 'terracotta' | 'sage' | 'ochre';
  className?: string;
}> = ({ color = 'yellow', className = 'w-24 h-24' }) => {
  const colors = {
    yellow: 'bg-amber-300/60',
    terracotta: 'bg-orange-300/50',
    sage: 'bg-emerald-200/55',
    ochre: 'bg-yellow-400/40',
  };

  return (
    <div
      className={`absolute pointer-events-none rounded-[50%_50%_40%_60%/40%_60%_50%_50%] blur-[3px] -z-10 ${colors[color]} ${className}`}
    />
  );
};
