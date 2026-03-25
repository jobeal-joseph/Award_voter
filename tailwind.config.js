/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#4A90D9',
          blueHover: '#5BA0E9',
          gray: {
            50: '#fbfbfd',
            100: '#f5f5f7',
            200: '#e8e8ed',
            300: '#d2d2d7',
            400: '#86868b',
            500: '#6e6e73',
            600: '#424245',
            700: '#333336',
            800: '#1d1d1f',
          }
        },
        chrome: {
          900: '#0c203dff',
          800: '#0d1f3c',
          700: '#132d54',
          600: '#1a3a6b',
        },
        gold: {
          50: '#fdf8e8',
          100: '#f5e6b8',
          200: '#e8cc6e',
          300: '#d4af37',
          400: '#c9a027',
          500: '#b8912a',
          600: '#9a7a24',
        }
      },
      fontFamily: {
        sans: ['Alegreya', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
