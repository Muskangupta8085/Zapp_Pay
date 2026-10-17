import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ZappPayLogoProps {
  /** Display variant: 'full' (icon + Zapp + square dot + PAY) | 'compact' (icon + Zapp + square dot) | 'icon-only' | 'text-only' */
  variant?: 'full' | 'compact' | 'icon-only' | 'text-only';
  /** Preset size or custom pixel size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Explicit color mode override (default: auto from ThemeContext) */
  mode?: 'auto' | 'light' | 'dark' | 'white';
  /** Enable subtle hover micro-interaction */
  interactive?: boolean;
  /** Click callback */
  onClick?: () => void;
  /** Custom className */
  className?: string;
  /** Custom style overrides */
  style?: React.CSSProperties;
}

/**
 * ⚡ ZappPayIcon: The exact deep-indigo squircle with electric golden-yellow lightning bolt
 * Matches the uploaded reference image 1:1
 */
export const ZappPayIcon: React.FC<{
  size?: number;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ size = 42, glow = true, className, style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        flexShrink: 0,
        display: 'block',
        filter: glow ? 'drop-shadow(0 4px 14px rgba(41, 26, 136, 0.35))' : 'none',
        transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.22s ease',
        ...style,
      }}
    >
      {/* ── Squircle Container (Deep Indigo / Violet-Blue) ── */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="18"
        fill="#291A88"
      />

      {/* ── Electric Golden Lightning Bolt (Matches Reference Image) ── */}
      <path
        d="M36 14L19 34H33L24 50L40 29H28L36 14Z"
        fill="#FFD026"
      />
    </svg>
  );
};

/**
 * 🚀 ZappPayLogo: Pixel-Perfect Brand Logo
 * Exactly matching the uploaded image:
 * [ Squircle Bolt ]  Zapp ■
 *                    P A Y
 */
export const ZappPayLogo: React.FC<ZappPayLogoProps> = ({
  variant = 'full',
  size = 'md',
  mode = 'auto',
  interactive = true,
  onClick,
  className = '',
  style,
}) => {
  const { isDark } = useTheme();

  // Metrics for different sizes
  const sizeMap = {
    xs: { icon: 26, textZapp: 16, dotSize: 4.5, textPay: 7.5, paySpacing: '0.42em', gap: 8 },
    sm: { icon: 34, textZapp: 21, dotSize: 5.5, textPay: 9.5, paySpacing: '0.44em', gap: 10 },
    md: { icon: 42, textZapp: 26, dotSize: 6.5, textPay: 11.5, paySpacing: '0.45em', gap: 12 },
    lg: { icon: 54, textZapp: 34, dotSize: 8.5, textPay: 15, paySpacing: '0.46em', gap: 15 },
    xl: { icon: 68, textZapp: 44, dotSize: 11, textPay: 19, paySpacing: '0.48em', gap: 18 },
  };

  const metrics =
    typeof size === 'number'
      ? {
          icon: size,
          textZapp: Math.round(size * 0.62),
          dotSize: Math.max(4, Math.round(size * 0.16)),
          textPay: Math.round(size * 0.28),
          paySpacing: '0.45em',
          gap: Math.max(8, Math.round(size * 0.28)),
        }
      : sizeMap[size] || sizeMap.md;

  // Resolve light / dark mode
  const effectiveDark =
    mode === 'dark' || (mode === 'auto' && isDark) || mode === 'white';
  const isPureWhite = mode === 'white';

  const brandColor = isPureWhite
    ? '#FFFFFF'
    : effectiveDark
    ? '#FFFFFF'
    : '#291A88';

  const payColor = isPureWhite
    ? '#E2E8F0'
    : effectiveDark
    ? '#CBD5E1'
    : '#291A88';

  const yellowAccent = '#FFD026';

  return (
    <div
      onClick={onClick}
      className={`zapp-pay-logo ${interactive ? 'zapp-pay-logo-interactive' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${metrics.gap}px`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      {/* ── 1. The Squircle Icon Emblem ── */}
      {variant !== 'text-only' && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ZappPayIcon size={metrics.icon} glow={true} />
        </div>
      )}

      {/* ── 2. The Wordmark: Zapp. + PAY ── */}
      {variant !== 'icon-only' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: variant === 'full' ? '2px' : '0px',
          }}
        >
          {/* Top Row: Zapp + Yellow Square Dot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${Math.max(3, Math.round(metrics.dotSize * 0.5))}px`,
              lineHeight: 1,
            }}
          >
            {/* Zapp text */}
            <span
              style={{
                fontSize: `${metrics.textZapp}px`,
                fontWeight: 900,
                color: brandColor,
                fontFamily: "system-ui, -apple-system, 'Plus Jakarta Sans', Inter, sans-serif",
                letterSpacing: '-0.5px',
                transition: 'color 0.2s ease',
                lineHeight: 0.95,
              }}
            >
              Zapp
            </span>

            {/* Exact Yellow Square Dot from image */}
            <span
              style={{
                width: `${metrics.dotSize}px`,
                height: `${metrics.dotSize}px`,
                backgroundColor: yellowAccent,
                display: 'inline-block',
                borderRadius: '1px',
                flexShrink: 0,
                alignSelf: 'flex-end',
                marginBottom: `${Math.round(metrics.dotSize * 0.45)}px`,
              }}
            />
          </div>

          {/* Bottom Row: P A Y (Tracked uppercase, exact match) */}
          {variant === 'full' && (
            <div
              style={{
                fontSize: `${metrics.textPay}px`,
                fontWeight: 700,
                color: payColor,
                letterSpacing: metrics.paySpacing,
                textTransform: 'uppercase',
                fontFamily: "system-ui, -apple-system, 'Plus Jakarta Sans', Inter, sans-serif",
                lineHeight: 1,
                paddingLeft: '1px',
                marginTop: '1px',
                transition: 'color 0.2s ease',
              }}
            >
              PAY
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ZappPayLogo;
