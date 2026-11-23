import React from 'react';

interface DiskLogoProps {
  className?: string;
  size?: number;
}

export function DiskLogo({ className = '', size = 32 }: DiskLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dlBgGlow" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#1e1e24" />
          <stop offset="60%" stopColor="#121215" />
          <stop offset="100%" stopColor="#09090b" />
        </radialGradient>

        <linearGradient id="dlEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>

        <radialGradient id="dlAmberGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2ae3d" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f2ae3d" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="dlSlice1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5ba50" />
          <stop offset="100%" stopColor="#f08a3c" />
        </linearGradient>

        <linearGradient id="dlSlice2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e06228" />
          <stop offset="100%" stopColor="#b83818" />
        </linearGradient>

        <linearGradient id="dlTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2c2c34" />
          <stop offset="100%" stopColor="#1b1b22" />
        </linearGradient>
      </defs>

      {/* Squircle App Icon Base */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="112"
        ry="112"
        fill="url(#dlBgGlow)"
        stroke="url(#dlEdgeGrad)"
        strokeWidth="3"
      />

      {/* Ambient Focal Glow */}
      <circle cx="256" cy="256" r="170" fill="url(#dlAmberGlow)" />

      {/* Central Segmented Disk Platter */}
      <g transform="translate(256, 256)">
        {/* Unallocated Track Base */}
        <circle
          cx="0"
          cy="0"
          r="140"
          fill="none"
          stroke="url(#dlTrackGrad)"
          strokeWidth="48"
          strokeLinecap="round"
        />

        {/* Secondary Cached Sector */}
        <path
          d="M -90 107 A 140 140 0 0 1 -140 0"
          fill="none"
          stroke="url(#dlSlice2)"
          strokeWidth="48"
          strokeLinecap="round"
        />

        {/* Primary Active Storage Arc */}
        <path
          d="M 70 -121 A 140 140 0 0 1 0 140"
          fill="none"
          stroke="url(#dlSlice1)"
          strokeWidth="52"
          strokeLinecap="round"
        />

        {/* Core Hub Spindle */}
        <circle
          cx="0"
          cy="0"
          r="62"
          fill="#15151a"
          stroke="#ffffff"
          strokeOpacity="0.12"
          strokeWidth="3"
        />

        {/* Diagnostic Jewel */}
        <circle cx="0" cy="0" r="22" fill="#f2ae3d" />
        <circle cx="0" cy="0" r="14" fill="#fff5e0" />
      </g>
    </svg>
  );
}
