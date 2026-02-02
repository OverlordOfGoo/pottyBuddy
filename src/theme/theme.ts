// Centralized theme file so the whole app stays consistent.
// Update colors/spacing once here and it affects all components/screens.

export const theme = {
  colors: {
    bg: '#0B0F14',
    surface: '#121924',
    surface2: '#182234',
    text: '#EAF2FF',
    muted: '#AAB7CF',
    primary: '#4DA3FF',
    border: 'rgba(255,255,255,0.10)',
  },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24 },
  radius: { sm: 10, md: 14, lg: 18 },
  type: {
    h1: { fontSize: 24, fontWeight: '700' as const },
    h2: { fontSize: 18, fontWeight: '700' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    small: { fontSize: 13, fontWeight: '400' as const },

    // ✅ ADD THIS so buttons can use a dedicated style
    button: { fontSize: 16, fontWeight: '700' as const },
  },
};

