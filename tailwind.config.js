/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          indigo: '#4F46E5',
          'indigo-dark': '#3730A3',
          orange: '#F97316',
          'dark-bg': '#0F172A',
          surface: '#F8FAFC',
          text: '#1E293B',
          muted: '#64748B',
          success: '#10B981',
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'dot-pulse': 'dotPulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249,115,22,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(249,115,22,0.6)' },
        },
        scanLine: {
          '0%': { top: '10%' },
          '100%': { top: '85%' },
        },
        dotPulse: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}
