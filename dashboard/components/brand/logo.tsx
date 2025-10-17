'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'default' | 'icon' | 'dark'
  animated?: boolean
}

export function Logo({ className, variant = 'default', animated = false }: LogoProps) {
  const showWordmark = variant === 'default'
  const isDark = variant === 'dark'

  return (
    <svg
      width={showWordmark ? "180" : "48"}
      height="40"
      viewBox={showWordmark ? "0 0 180 40" : "0 0 48 40"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", animated && "hover:scale-105", className)}
    >
      {/* Wave pulse forming "V" shape */}
      <g id="logo-mark">
        {/* Left wave ascending */}
        <path
          d="M2 28 Q6 24, 10 20 T18 12 L22 8"
          stroke={isDark ? "#FFFFFF" : "#14B8A6"}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className={animated ? "animate-pulse" : ""}
        />
        <path
          d="M2 28 Q6 25, 10 22 T18 16 L22 12"
          stroke={isDark ? "#FFFFFF" : "#14B8A6"}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        {/* Right wave descending */}
        <path
          d="M22 8 L26 12 Q30 16, 34 20 T42 28 L46 32"
          stroke={isDark ? "#FFFFFF" : "#14B8A6"}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className={animated ? "animate-pulse" : ""}
        />
        <path
          d="M22 12 L26 16 Q30 20, 34 24 T42 30 L46 32"
          stroke={isDark ? "#FFFFFF" : "#14B8A6"}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        {/* Scanning beam accent */}
        <line
          x1="20"
          y1="2"
          x2="28"
          y2="38"
          stroke="url(#gradient-scan)"
          strokeWidth={showWordmark ? "1" : "1.5"}
          opacity={showWordmark ? "0.4" : "0.5"}
        />

        {/* Center V connection (focal point) */}
        <circle cx="22" cy="8" r={showWordmark ? "2.5" : "3"} fill="#F97316" />
        {!showWordmark && (
          <circle cx="22" cy="8" r="2" fill="#FFFFFF" opacity="0.3" />
        )}
      </g>

      {/* Gradient for scanning beam */}
      <defs>
        <linearGradient id="gradient-scan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#8B5CF6", stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: "#8B5CF6", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#F97316", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Wordmark */}
      {showWordmark && (
        <g id="wordmark" transform="translate(58, 0)">
          <text
            x="0"
            y="28"
            fontFamily="Inter, sans-serif"
            fontSize="22"
            fontWeight="700"
            fill={isDark ? "#FFFFFF" : "currentColor"}
          >
            VibeScan
          </text>
        </g>
      )}
    </svg>
  )
}
