export const Colors = {
  // Theme inspired by modern crypto fintech apps (Zapp Pay)
  primary: '#4318FF',       // Deep Royal Indigo / Purple
  primaryLight: '#7551FF',  // Lighter Purple accent
  primaryGradient: ['#4318FF', '#868CFF'],
  cardGradient: ['#4318FF', '#6B35FF'],
  secondaryGradient: ['#F97316', '#FB923C'],

  background: '#F4F7FE',    // Clean app background
  card: '#FFFFFF',          // Crisp white container
  surface: '#FFFFFF',
  surfaceVariant: '#F7F9FF',
  border: '#E0E5F2',
  divider: '#EEF2F6',

  // Dark Splash theme
  splashBg: '#090D28',
  splashCard: '#131843',
  splashBorder: '#232960',

  // Text
  textPrimary: '#1B2559',
  textSecondary: '#8F9BBA',
  textMuted: '#A3AED0',
  textWhite: '#FFFFFF',

  // Functional colors
  success: '#05CD99',
  successLight: '#E6FAF5',
  warning: '#FFB547',
  warningLight: '#FFF7EB',
  danger: '#EE5D50',
  dangerLight: '#FEEFEE',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Inputs
  inputBg: '#F4F7FE',
  inputBorder: '#E0E5F2',
  inputActiveBorder: '#4318FF',

  dark: {
    background: '#0B0E28',
    surface: '#141842',
    card: '#1B2052',
    border: '#272E6F',
    textPrimary: '#FFFFFF',
    textSecondary: '#A3AED0',
  }
};

export type ThemeColors = typeof Colors;
