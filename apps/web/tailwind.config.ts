import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Syne"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: {
          bg: '#090b10',
          sidebar: '#0c0f17',
          surface: '#111520',
          elevated: '#161b28',
          border: '#1e2535',
          accent: '#38bdf8',
          'accent-indigo': '#818cf8',
          'accent-purple': '#c084fc',
          'accent-hover': '#0ea5e9',
          'accent-subtle': 'rgba(56,189,248,0.10)',
          muted: '#64748b',
          dim: '#334155',
        },
      },
      boxShadow: {
        ring: '0 0 0 2px rgba(56, 189, 248, 0.35)',
        composer: '0 0 0 1.5px rgba(56,189,248,0.35), 0 2px 24px rgba(56,189,248,0.06)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.4)',
        glow: '0 0 40px rgba(56,189,248,0.15)',
        'glow-purple': '0 0 40px rgba(192,132,252,0.15)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config
