/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tera: {
          bg:      '#000000',
          surface: '#1C1C1E',
          elevated:'#2C2C2E',
          sidebar: '#1C1C1E',
          border:  'rgba(84,84,88,0.65)',
          divider: 'rgba(84,84,88,0.36)',
          text:    '#FFFFFF',
          sub:     '#8E8E93',
          muted:   '#636366',
          green:   '#1DB814',
          red:     '#FF453A',
          blue:    '#0A84FF',
          yellow:  '#FF9F0A',
          purple:  '#BF5AF2',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'ios':    '10px',
        'ios-md': '13px',
        'ios-lg': '16px',
        'ios-xl': '18px',
        'ios-2xl':'20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.2s ease',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
