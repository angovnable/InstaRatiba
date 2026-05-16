/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Kenyan / EAC design tokens ────────────────────────
        primary:          '#0D3D23',   // Mau Forest
        'primary-hover':  '#1A5C3A',   // lighter Mau Forest for hover
        gold:             '#C8922A',   // Savanna Gold
        'gold-hover':     '#B57E21',   // 10% darker gold
        red:              '#A01F1F',   // Rift Red
        surface:          '#F7F5EF',   // Kilimanjaro Ivory
        dark:             '#0F1B14',   // Nairobi Night
        ocean:            '#1E5C8A',   // Indian Ocean
        'ir-text':        '#1C2B22',   // Charcoal
        muted:            '#7A8C82',   // Dust
        'accent-light':   '#EDE7D9',   // Savanna Mist

        // ── Semantic aliases (backward compat) ────────────────
        'accent-gold':    '#C8922A',
        'ir-error':       '#A01F1F',
        warn:             '#C8922A',
        info:             '#1E5C8A',

        // ── Dark mode surface overrides ───────────────────────
        'dark-surface':   '#111814',
        'dark-card':      '#182118',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        ui:      ['Outfit', 'sans-serif'],
        body:    ['Figtree', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        sm:  '6px',
        md:  '10px',
        lg:  '16px',
        xl:  '22px',
      },
      boxShadow: {
        sm:   '0 1px 3px rgba(13,61,35,0.06)',
        md:   '0 2px 12px rgba(13,61,35,0.06)',
        lg:   '0 8px 24px rgba(13,61,35,0.10)',
        gold: '0 8px 24px rgba(200,146,42,0.12)',
        btn:  '0 4px 14px rgba(13,61,35,0.30)',
      },
      animation: {
        shimmer:     'shimmer 1.4s infinite',
        'spin-slow': 'spin 0.7s linear infinite',
        'fade-in':   'fadeIn 0.3s ease',
        'slide-up':  'slideUp 0.35s ease',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'shake':     'shake 0.3s ease',
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
