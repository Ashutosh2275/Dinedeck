/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#090D16',
          surface: '#111827',
          card: '#1F2937',
          border: '#374151',
          primary: '#3B82F6',
          primaryHover: '#2563EB',
          accent: '#8B5CF6',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
