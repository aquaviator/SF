import React from 'react';

export interface ShiftFloLogoProps {
  /** CSS class for the SVG wrapper */
  className?: string;
  /** Width of the logo (defaults to 40) */
  width?: number | string;
  /** Height of the logo (defaults to 40) */
  height?: number | string;
}

const ShiftFloLogo: React.FC<ShiftFloLogoProps> = ({
  className = '',
  width = 40,
  height = 40,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ background: 'var(--icon-bg, #f8fafc)' }}
  >
    <defs>
      <linearGradient id="ShiftFloLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: 'var(--icon-border, #334155)', stopOpacity: 1 }}
        />
        <stop
          offset="100%"
          style={{ stopColor: 'var(--icon-accent, #1e293b)', stopOpacity: 1 }}
        />
      </linearGradient>
    </defs>

    {/* Outer rounded square */}
    <rect
      x={2}
      y={2}
      width={36}
      height={36}
      rx={8}
      ry={8}
      fill="var(--icon-bg, #f8fafc)"
      stroke="var(--icon-border, #cbd5e1)"
      strokeWidth={1}
    />

    {/* SF text in gradient */}
    <text
      x={20}
      y={24}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize={16}
      fontWeight={700}
      fill="url(#ShiftFloLogoGradient)"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      SF
    </text>
  </svg>
);

export default ShiftFloLogo;