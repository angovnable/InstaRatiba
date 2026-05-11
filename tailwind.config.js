/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:      '#2E7D32',
        'primary-dark': '#1B5E20',
        mid:          '#4CAF50',
        'accent-light': '#A5D6A7',
        surface:      '#E8F5E9',
        'ir-text':    '#37474F',
        muted:        '#757575',
        'ir-bg':      '#F5F5F5',
        warn:         '#FFB300',
        'ir-error':   '#E53935',
        info:         '#1565C0',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '22px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 28px rgba(0,0,0,0.13)',
      },
      animation: {
        shimmer:      'shimmer 1.4s infinite',
        'spin-slow':  'spin 0.7s linear infinite',
        'fade-in':    'fadeIn 0.3s ease',
        'slide-up':   'slideUp 0.35s ease',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'shake':      'shake 0.3s ease',
      },
      keyframes: {
        shimmer:  { to: { backgroundPosition: '-200% 0' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shake:    { '0%,100%': { transform: 'none' }, '20%,60%': { transform: 'translateX(-5px)' }, '40%,80%': { transform: 'translateX(5px)' } },
      },
    },
  },
  plugins: [],
}
