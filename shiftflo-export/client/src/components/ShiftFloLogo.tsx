import React from "react";

export interface ShiftFloLogoProps {
  /** CSS class for the SVG wrapper */
  className?: string;
  /** Width of the logo (defaults to 40) */
  width?: number | string;
  /** Height of the logo (defaults to 40) */
  height?: number | string;
  /** Main gradient stop color */
  primaryColor?: string;
  /** Secondary tone (header bar / holes) */
  accentColor?: string;
}

const ShiftFloLogo: React.FC<ShiftFloLogoProps> = ({
  className = "",
  width = 40,
  height = 40,
  primaryColor = "var(--icon-accent, #1e293b)",
  accentColor = "var(--icon-border, #334155)",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="sf-main-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
        <stop offset="100%" stopColor={primaryColor} stopOpacity="1" />
      </linearGradient>
      <filter id="sf-drop" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="2"
          floodColor="rgba(0,0,0,0.2)"
        />
      </filter>
    </defs>

    {/* Body of calendar with drop shadow */}
    <rect
      x="2"
      y="6"
      width="36"
      height="30"
      rx="6"
      fill="url(#sf-main-grad)"
      filter="url(#sf-drop)"
    />

    {/* Top header bar */}
    <rect x="2" y="6" width="36" height="8" rx="4" fill={accentColor} />

    {/* Punch-hole circles */}
    <circle cx="10" cy="10" r="2" fill="#fff" />
    <circle cx="20" cy="10" r="2" fill="#fff" />
    <circle cx="30" cy="10" r="2" fill="#fff" />

    {/* SF Monogram */}
    <text
      x="20"
      y="28"
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="18"
      fontWeight="700"
      fill="#fff"
    >
      SF
    </text>
  </svg>
);

export default ShiftFloLogo;
