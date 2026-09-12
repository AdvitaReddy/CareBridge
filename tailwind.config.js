/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F4B942',
        'primary-text': '#2D2A3D',
        secondary: '#FF8C69',
        'secondary-text': '#FFFFFF',
        tertiary: '#FFEDD8',
        'tertiary-text': '#2D2A3D',
        success: '#52B788',
        'success-text': '#FFFFFF',
        danger: '#E63946',
        'danger-text': '#FFFFFF',
        'bg-light': '#FFFBEF',
        'bg-dark': '#2B2438',
        'surface-light': '#FFFFFF',
        'surface-dark': '#362F4A',
        'text-light': '#2D2A3D',
        'text-dark': '#F5F0E6',
        'text-muted-light': '#8B8578',
        'text-muted-dark': '#ADA6C2',
        primary: {
          DEFAULT: '#F4B942',
          50: '#FFFDF8', 100: '#FFFDF3', 200: '#FFFBEF', 300: '#FFF0C2',
          400: '#F4B942', 500: '#F4B942', 600: '#D99B22', 700: '#A97412',
        },
        secondary: {
          DEFAULT: '#FF8C69',
          50: '#FFF0EB', 100: '#FFE0D6', 200: '#FFC2B0', 300: '#FFA48D',
          400: '#FF8C69', 500: '#FF8C69', 600: '#E96F4E', 700: '#BE5038',
        },
        tertiary: { 50: '#FFF9F1', 100: '#FFEDD8', 200: '#F9D9B7' },
        accent: { DEFAULT: '#FF8C69', 50: '#FFF0EB', 100: '#FFE0D6', 200: '#FFC2B0', 500: '#FF8C69', 600: '#E96F4E', 700: '#BE5038' },
        success: { DEFAULT: '#52B788', 50: '#E8F7EF', 100: '#D3EFDF', 200: '#A9DFC1', 500: '#52B788', 600: '#3E9A6F', 700: '#2C7654' },
        warning: { DEFAULT: '#F4B942', 50: '#FFFDF8', 100: '#FFFDF3', 200: '#FFF0C2', 500: '#F4B942', 600: '#A97412', 700: '#76510B' },
        danger: { DEFAULT: '#E63946', 50: '#FDEBED', 100: '#FAD6D9', 200: '#F2AEB4', 500: '#E63946', 600: '#C92F3B', 700: '#9C202A' },
        neutral: { 50: '#FFFBEF', 100: '#F7F1E7', 200: '#E8E0D4', 300: '#D5CBBE', 400: '#ADA397', 500: '#8B8578', 600: '#665F55', 700: '#4A4450', 800: '#2D2A3D', 900: '#2B2438' },
      },
      fontFamily: {
        heading: ['Times New Roman', 'Georgia', 'serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        display: ['Times New Roman', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'sos-ripple': 'sosRipple 0.7s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        sosRipple: {
          '0%': { boxShadow: '0 0 0 0 rgba(230, 57, 70, 0.45)' },
          '100%': { boxShadow: '0 0 0 28px rgba(230, 57, 70, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
