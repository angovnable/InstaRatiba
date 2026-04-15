/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Inter', 'Open Sans', 'Montserrat', 'sans-serif'],
        display: ['Montserrat', 'Roboto', 'Open Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        gold: '#D4A017',
        orange: '#E65100',
        skyblue: '#039BE5',
        navy: '#1A3A5C',
      },
    },
  },
  plugins: [],
}
