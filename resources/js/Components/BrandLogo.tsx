import React, { useId } from 'react';

interface BrandLogoProps {
  size?: number; // icon size in px
  showText?: boolean;
  className?: string;
}

export default function BrandLogo({ size = 36, showText = true, className }: BrandLogoProps) {
  const gradId = useId();

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id={`grad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="25%" stopColor="#9C27B0" />
            <stop offset="50%" stopColor="#EA4335" />
            <stop offset="75%" stopColor="#FBBC04" />
            <stop offset="100%" stopColor="#34A853" />
          </linearGradient>
        </defs>
        
        {/* Simple, clean photo icon - Google Photos style */}
        <rect x="6" y="6" width="28" height="28" rx="6" fill={`url(#grad-${gradId})`} />
        
        {/* Photo icon - simple and elegant */}
        <g transform="translate(10, 10)">
          {/* Main photo shape */}
          <rect x="0" y="0" width="20" height="15" rx="1.5" fill="white" />
          
          {/* Photo content - gradient */}
          <rect x="1.5" y="1.5" width="17" height="12" rx="0.5" fill={`url(#grad-${gradId})`} opacity="0.8" />
          
          {/* Corner accent */}
          <path d="M0,0 L6,0 L0,6 Z" fill="white" opacity="0.9" />
        </g>
      </svg>

      {showText && (
        <div className="flex items-baseline gap-1.5">
          <span className="select-none text-[20px] font-medium tracking-tight text-gray-900 dark:text-gray-100">
            Photos
          </span>
          <span className="select-none text-[13px] font-normal tracking-wide text-gray-500 dark:text-gray-400">
            Clone
          </span>
        </div>
      )}
    </div>
  );
}
