// 앱 전체 디자인 시스템

export const colors = {
  primary: '#2D2D2D',
  accent: '#C4A882',
  accentLight: '#F0E8DB',
  background: '#F8F7F5',
  surface: '#FFFFFF',
  border: '#EBEBEB',
  error: '#E53935',
  success: '#43A047',
  warning: '#FB8C00',

  text: {
    primary: '#1A1A1A',
    secondary: '#6B6B6B',
    tertiary: '#ABABAB',
    inverse: '#FFFFFF',
    accent: '#C4A882',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: '#1A1A1A',
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: '#1A1A1A',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6B6B6B',
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#ABABAB',
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
