import React, { useId } from 'react';

export interface DineDeckLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  className?: string;
  fullScreen?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  showWordmark?: boolean;
}

export const DineDeckLoader: React.FC<DineDeckLoaderProps> = ({
  size = 'md',
  label = 'Preparing Your Dining Experience...',
  sublabel,
  className = '',
  fullScreen = false,
  showWordmark = false
}) => {
  const gradientId = useId().replace(/:/g, '');

  const sizeMap = {
    sm: {
      container: 'w-12 h-12',
      emblem: 'w-6 h-6',
      strokeWidth: 3.5,
      radius: 43,
      dasharray: '130 280',
      text: 'text-xs',
      subtext: 'text-[10px]'
    },
    md: {
      container: 'w-20 h-20',
      emblem: 'w-11 h-11',
      strokeWidth: 4,
      radius: 43,
      dasharray: '150 280',
      text: 'text-sm',
      subtext: 'text-xs'
    },
    lg: {
      container: 'w-28 h-28',
      emblem: 'w-16 h-16',
      strokeWidth: 4.5,
      radius: 43,
      dasharray: '170 280',
      text: 'text-base',
      subtext: 'text-xs'
    },
    xl: {
      container: 'w-36 h-36',
      emblem: 'w-20 h-20',
      strokeWidth: 5,
      radius: 43,
      dasharray: '180 280',
      text: 'text-lg',
      subtext: 'text-sm'
    }
  };

  const currentSize = sizeMap[size];

  const content = (
    <div
      className={`flex flex-col items-center justify-center space-y-4 select-none ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading DineDeck'}
    >
      {/* Centerpiece: Prominent Rotating Orange Arc with Stationary Centered Official Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Brand Glow behind ring */}
        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl transform scale-110 pointer-events-none" />

        {/* Outer Circular Loader Container with Smooth Rotating Arc */}
        <div className={`relative ${currentSize.container} flex items-center justify-center`}>
          <svg
            className="w-full h-full animate-spin motion-reduce:animate-none"
            style={{
              animationDuration: '1.2s',
              animationTimingFunction: 'linear'
            }}
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id={`dinedeckOrangeArc-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="60%" stopColor="#FF5500" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FF3300" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Subtle background track */}
            <circle
              cx="50"
              cy="50"
              r={currentSize.radius}
              fill="none"
              stroke="rgba(255, 107, 0, 0.12)"
              strokeWidth={currentSize.strokeWidth}
            />

            {/* Continuous Rotating Arc with Trailing Gradient */}
            <circle
              cx="50"
              cy="50"
              r={currentSize.radius}
              fill="none"
              stroke={`url(#dinedeckOrangeArc-${gradientId})`}
              strokeWidth={currentSize.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={currentSize.dasharray}
            />
          </svg>

          {/* Crisp, Stationary, Official Center Emblem */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/dinedeck-emblem.png"
              alt="DineDeck Emblem"
              className={`${currentSize.emblem} object-contain drop-shadow-md select-none transition-transform`}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Branded Status Typography */}
      {(label || showWordmark) && (
        <div className="text-center space-y-1.5 max-w-sm px-4">
          {showWordmark && (
            <div className="flex justify-center mb-1">
              <img
                src="/dinedeck-logo-dark.png"
                alt="DineDeck"
                className="h-6 object-contain"
                draggable={false}
              />
            </div>
          )}

          {label && (
            <div className={`${currentSize.text} font-bold text-white tracking-tight leading-snug`}>
              {label}
            </div>
          )}

          {sublabel && (
            <div className={`${currentSize.subtext} font-medium text-slate-400 leading-relaxed`}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B1120] flex items-center justify-center p-6 antialiased">
        {content}
      </div>
    );
  }

  return content;
};
