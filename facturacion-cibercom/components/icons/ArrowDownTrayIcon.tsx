import React from 'react';

interface ArrowDownTrayIconProps {
  className?: string;
}

export const ArrowDownTrayIcon: React.FC<ArrowDownTrayIconProps> = ({ className = "h-5 w-5" }) => {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" 
      />
    </svg>
  );
};
