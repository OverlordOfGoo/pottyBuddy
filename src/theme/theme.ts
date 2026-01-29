// Centralized theme file so the whole app stays consistent.
// Update colors/spacing once here and it affects all components/screens.

export const theme = {
  colors: {
    background: '#0B0F14',
    surface: '#121924',
    surface2: '#182234',
    text: '#EAF2FF',
    textMuted: '#AAB7CF',
    primary: '#4DA3FF',
    primaryPressed: '#2E7ED6',
    border: 'rgba(255,255,255,0.10)',
    danger: '#FF5A5F',
    success: '#35D07F',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    pill: 999,
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' as const },
    h2: { fontSize: 18, fontWeight: '700' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    small: { fontSize: 13, fontWeight: '400' as const },
    button: { fontSize: 16, fontWeight: '700' as const },
  },
};
