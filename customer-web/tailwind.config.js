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
        dinedeck: {
          bg: '#0B0F19',
          surface: '#151D30',
          card: '#1E293B',
          border: '#334155',
          primary: '#FF5722',
          primaryHover: '#F4511E',
          secondary: '#38BDF8',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
