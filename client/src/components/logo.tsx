import React from 'react';

export function MediTrackLogo({ className = "", width = 140, height = 100 }: { className?: string, width?: number, height?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 120" 
      width={width} 
      height={height} 
      className={className}
    >
      {/* Cross Symbol */}
      <rect x="80" y="15" width="40" height="90" rx="5" fill="#E74C3C" />
      <rect x="55" y="40" width="90" height="40" rx="5" fill="#E74C3C" />
      
      {/* Location Pin */}
      <circle cx="100" cy="60" r="15" fill="#FFFFFF" />
      <path d="M100 40 C 85 60, 90 80, 100 78 C 110 80, 115 60, 100 40" fill="#3498DB" />
      
      {/* Heartbeat Line */}
      <path d="M35 70 L 45 70 L 55 45 L 70 95 L 85 20 L 100 60 L 115 50 L 130 70 L 145 70 L 165 70" 
            stroke="#2ECC71" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" />
    </svg>
  );
}