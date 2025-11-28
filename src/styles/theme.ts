// Design system for Yoyaku Yo landing page
// All landing page components must use this theme

export const theme = {
  colors: {
    primaryBg: '#050816',
    primaryText: '#F9FAFB',
    accentPink: '#EC4899',
    accentBlue: '#0EA5E9',
    mutedText: '#9CA3AF',
    cardBg: '#0B1120',
    borderSoft: '#1F2933',
  },
  typography: {
    heading: {
      fontFamily: '"Poppins", system-ui, sans-serif',
      weights: {
        normal: 600,
        bold: 700,
      },
    },
    body: {
      fontFamily: '"Inter", system-ui, sans-serif',
      weights: {
        normal: 400,
        medium: 500,
      },
    },
  },
  borderRadius: '1.2rem',
} as const;

// Tailwind CSS classes that match the theme
export const themeClasses = {
  bg: {
    primary: 'bg-[#050816]',
    card: 'bg-[#0B1120]',
  },
  text: {
    primary: 'text-[#F9FAFB]',
    muted: 'text-[#9CA3AF]',
  },
  accent: {
    pink: 'text-[#EC4899]',
    blue: 'text-[#0EA5E9]',
  },
  border: {
    soft: 'border-[#1F2933]',
  },
  font: {
    heading: 'font-heading',
    body: 'font-body',
  },
} as const;

