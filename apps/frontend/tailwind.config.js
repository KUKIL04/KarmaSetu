/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gamboge: {
          50: '#fff9ec', 100: '#fdeacc', 200: '#fad399', 300: '#f6b866', 400: '#f3a03c', 
          500: '#e49b0f', 600: '#c87c0a', 700: '#a65e0b', 800: '#854911', 900: '#6d3c11',
        },
        lightgray: '#E6E9EF',
        slate: {
          850: '#151e2e',
          900: '#0f172a',
        },
        brand: {
          ochre: '#C7923E',
          gold: '#D4AF37',
          light: '#F3E5AB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}