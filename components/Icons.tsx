
import React from 'react';

export const ShammariLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 800 600" 
      className={className} 
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 3D Red Background Gradient */}
        <radialGradient id="redBgGrad" cx="50%" cy="30%" r="90%" fx="50%" fy="30%">
          <stop offset="0%" stopColor="#b91c1c" /> {/* Red 700 */}
          <stop offset="100%" stopColor="#450a0a" /> {/* Red 950/Black */}
        </radialGradient>

        {/* Gold Gradient for Crescent/Star */}
        <linearGradient id="goldGrad" x1="20%" y1="20%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" /> {/* Light Gold */}
          <stop offset="40%" stopColor="#F59E0B" /> {/* Gold */}
          <stop offset="100%" stopColor="#78350f" /> {/* Dark Bronze */}
        </linearGradient>

        {/* Shadow Filter for 3D effect */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dx="4" dy="8" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Text 3D Bevel effect */}
        <filter id="textBevel">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
            <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="10" lightingColor="white" result="specOut">
                <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint"/>
            <feMerge>
                <feMergeNode in="offsetBlur"/>
                <feMergeNode in="litPaint"/>
            </feMerge>
        </filter>
      </defs>

      {/* Background Layer */}
      <rect width="800" height="600" fill="url(#redBgGrad)" />

      {/* Large Golden Crescent (Left Side) */}
      <path 
        d="M250 50 C 50 150, 50 450, 250 550 C 120 450, 120 150, 250 50 Z" 
        fill="url(#goldGrad)" 
        filter="url(#dropShadow)"
      />

      {/* 8-Pointed Golden Star (Top Right) */}
      <g transform="translate(650, 120) scale(1.2)" filter="url(#dropShadow)">
        <path 
          d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10 Z" 
          fill="url(#goldGrad)"
          stroke="#B45309"
          strokeWidth="1"
        />
        <circle r="15" fill="none" stroke="#78350f" strokeWidth="2" opacity="0.6" />
      </g>

      {/* Stylized Arabic Text "Shammari" (Bottom Right) */}
      {/* Simulating the geometric Kufic/Modern style provided in the prompt */}
      <g transform="translate(450, 450)" filter="url(#textBevel)">
         {/* The word body (White) */}
         <path 
           d="
             M 280 -50 L 280 40 L 280 60 Q 280 80 260 80 L 180 80 
             L 180 40 L 160 40 L 160 80 L 100 80
             L 100 40 L 80 40 L 80 80 L 0 80 Q -30 80 -30 50 L -30 10 Q -30 -20 -60 -20 
             L -80 -20 L -80 10 Q -80 40 -50 60 L -50 80 Q -100 60 -100 10 L -100 -30 L 280 -30 L 280 -50 Z
           " 
           fill="#FFFFFF"
         />
         
         {/* The three dots for 'Sheen' (Triangle formation) */}
         <circle cx="220" cy="-60" r="12" fill="#FFFFFF" />
         <circle cx="190" cy="-40" r="12" fill="#FFFFFF" />
         <circle cx="250" cy="-40" r="12" fill="#FFFFFF" />
      </g>
    </svg>
  );
};
