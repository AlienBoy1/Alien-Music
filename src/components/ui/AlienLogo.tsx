interface AlienLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function AlienLogo({ size = 32, className = "", animated = false }: AlienLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? "animate-alien-float" : ""} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="alien-head-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ff9f" />
          <stop offset="50%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="alien-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="30" r="22" fill="url(#alien-head-grad)" filter="url(#alien-glow)" />
      <ellipse cx="22" cy="26" rx="7" ry="10" fill="#0a0a12" />
      <ellipse cx="42" cy="26" rx="7" ry="10" fill="#0a0a12" />
      <ellipse cx="22" cy="26" rx="3" ry="5" fill="#00ff9f" opacity="0.8" />
      <ellipse cx="42" cy="26" rx="3" ry="5" fill="#00ff9f" opacity="0.8" />
      <path
        d="M20 40 Q32 48 44 40"
        stroke="#0a0a12"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="32" cy="8" rx="3" ry="6" fill="url(#alien-head-grad)" opacity="0.7" />
    </svg>
  );
}
