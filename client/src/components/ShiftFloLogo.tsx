interface ShiftFloLogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'full' | 'icon';
}

export function ShiftFloLogo({ className = "", width = 40, height = 40, variant = 'icon' }: ShiftFloLogoProps) {
  if (variant === 'icon') {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 40 40" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ background: 'var(--icon-bg, #f8fafc)' }}
      >
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: "var(--icon-border, #334155)", stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: "var(--icon-accent, #1e293b)", stopOpacity: 1}} />
          </linearGradient>
        </defs>
        
        {/* Rounded rectangle background */}
        <rect 
          x="2" 
          y="2" 
          width="36" 
          height="36" 
          rx="8" 
          ry="8" 
          fill="var(--icon-bg, #f8fafc)" 
          stroke="var(--icon-border, #cbd5e1)" 
          strokeWidth="1"
        />
        
        {/* SF Text */}
        <text 
          x="20" 
          y="26" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="16" 
          fontWeight="700" 
          fill="url(#iconGradient)"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          SF
        </text>
      </svg>
    );
  }

  return (
    <svg 
      width={width || 200} 
      height={height || 80} 
      viewBox="0 0 200 80" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: "#2563eb", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "#1e40af", stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      {/* ShiftFlo Text */}
      <text 
        x="10" 
        y="50" 
        fontFamily="Arial, sans-serif" 
        fontSize="32" 
        fontWeight="bold" 
        fill="url(#textGradient)"
      >
        ShiftFlo
      </text>
      
      {/* Arrow Element */}
      <path 
        d="M170 25 L185 40 L170 55 M175 40 L190 40" 
        stroke="url(#textGradient)" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}