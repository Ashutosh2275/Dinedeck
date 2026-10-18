import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface DineDeckLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  sublabel?: string;
  className?: string;
  fullScreen?: boolean;
}

export const DineDeckLoader: React.FC<DineDeckLoaderProps> = ({
  size = 'md',
  label = 'Loading DineDeck Operations...',
  sublabel,
  className = '',
  fullScreen = false
}) => {
  const sizeMap = {
    sm: {
      ring: 'w-10 h-10 border-2',
      box: 'w-6 h-6 rounded-lg',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs'
    },
    md: {
      ring: 'w-16 h-16 border-[3px]',
      box: 'w-10 h-10 rounded-2xl',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      ring: 'w-24 h-24 border-4',
      box: 'w-14 h-14 rounded-2xl',
      icon: 'w-7 h-7',
      text: 'text-base'
    }
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3.5 select-none ${className}`}>
      {/* Official Brand Logo with Smooth Rotating Arc */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Orange Glow */}
        <div className="absolute inset-0 bg-orange-500/25 rounded-full blur-xl animate-pulse" />

        {/* Rotating Orange Arc Ring */}
        <div
          className={`${currentSize.ring} rounded-full border-orange-500 border-t-transparent border-r-orange-400 border-b-transparent border-l-transparent animate-spin`}
          style={{ animationDuration: '900ms', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Static Inner DineDeck Center Emblem */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`${currentSize.box} bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 border border-orange-400/40`}
          >
            <UtensilsCrossed className={`${currentSize.icon} text-white`} />
          </div>
        </div>
      </div>

      {/* Branded Label */}
      {label && (
        <div className="text-center space-y-0.5">
          <div className={`${currentSize.text} font-black text-white tracking-tight`}>
            {label}
          </div>
          {sublabel && (
            <div className="text-[11px] font-semibold text-slate-400">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};
