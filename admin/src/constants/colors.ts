// Exact color palette matching ZapCoin user app (frontend/src/constants/colors.ts)

export const Colors = {
  // Deep Royal Indigo / Purple Brand
  primary: '#4318FF',
  primaryLight: '#7551FF',
  primaryGlow: 'rgba(67, 24, 255, 0.15)',
  primaryGradient: 'linear-gradient(135deg, #4318FF 0%, #868CFF 100%)',
  cardGradient: 'linear-gradient(135deg, #4318FF 0%, #6B35FF 100%)',
  secondaryGradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',

  // Layout & Backgrounds - Adaptive to dark/light theme
  background: 'var(--bg-app, #F4F7FE)',
  card: 'var(--bg-card, #FFFFFF)',
  surface: 'var(--bg-card, #FFFFFF)',
  surfaceVariant: 'var(--bg-input, #F8FAFC)',
  border: 'var(--border-color, #E2E8F0)',
  divider: 'var(--border-light, #F1F5F9)',

  // Dark Sidebar & Splash Theme
  sidebarBg: '#111C44',
  splashBg: '#090D28',
  splashCard: '#131843',
  splashBorder: '#232960',

  // Typography - Adaptive to dark/light mode
  textPrimary: 'var(--text-main, #0F172A)',
  textSecondary: 'var(--text-secondary, #64748B)',
  textMuted: 'var(--text-muted, #94A3B8)',
  textWhite: '#FFFFFF',

  // Functional Status Colors
  success: '#05CD99',
  successLight: 'var(--status-active-bg, #DCFCE7)',
  warning: '#FFB547',
  warningLight: 'var(--status-pending-bg, #FEF9C3)',
  danger: '#EE5D50',
  dangerLight: 'var(--status-danger-bg, #FEE2E2)',
  info: '#3B82F6',
  infoLight: 'var(--status-processing-bg, #DBEAFE)',

  // Inputs
  inputBg: 'var(--bg-input, #F8FAFC)',
  inputBorder: 'var(--border-color, #E2E8F0)',
  inputActiveBorder: '#4318FF',
};

export type ThemeColors = typeof Colors;
