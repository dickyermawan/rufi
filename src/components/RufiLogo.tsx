'use client';

interface RufiLogoProps {
  size?: number;
  className?: string;
}

export function RufiLogo({ size = 32, className }: RufiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="rufiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle cx="32" cy="32" r="30" fill="url(#rufiGradient)" />
      
      {/* Cloud shape */}
      <ellipse cx="24" cy="28" rx="10" ry="8" fill="white" opacity="0.95" />
      <ellipse cx="36" cy="26" rx="12" ry="10" fill="white" opacity="0.95" />
      <ellipse cx="30" cy="32" rx="16" ry="10" fill="white" opacity="0.95" />
      
      {/* Folder icon */}
      <path
        d="M20 36 L20 44 L44 44 L44 36 L36 36 L34 34 L26 34 L24 36 Z"
        fill="url(#folderGradient)"
      />
      <path
        d="M20 36 L24 36 L26 34 L34 34 L36 36 L44 36 L44 38 L20 38 Z"
        fill="#FCD34D"
      />
      
      {/* Upload arrow */}
      <path
        d="M32 22 L38 28 L35 28 L35 33 L29 33 L29 28 L26 28 Z"
        fill="#3B82F6"
      />
    </svg>
  );
}

// Smaller variant for favicon
export function RufiLogoMini({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rufiMiniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#rufiMiniGradient)" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        R
      </text>
    </svg>
  );
}
