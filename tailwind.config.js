/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#212121',
        surface: '#333333',
        'surface-hover': '#444444',
        'text-primary': '#ECECEC',
        'text-secondary': '#A0A0A0',
        border: '#4A4A4A',
      },
      fontFamily: {
        sans: ['General Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'soft': '12px',
        'large': '24px',
      },
      keyframes: {
        shine: {
          '0%': { 'background-position': '100%' },
          '100%': { 'background-position': '-100%' },
        },
      },
      animation: {
        shine: 'shine 5s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 