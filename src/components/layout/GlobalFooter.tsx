// GlobalFooter — §3.4
// Fixed bottom footer with AG Computer Solutions branding, social icons,
// and floating WhatsApp help button.

const SOCIAL_LINKS = [
  { icon: 'bi-facebook',   href: '#', label: 'Facebook' },
  { icon: 'bi-instagram',  href: '#', label: 'Instagram' },
  { icon: 'bi-twitter-x',  href: '#', label: 'X / Twitter' },
  { icon: 'bi-linkedin',   href: '#', label: 'LinkedIn' },
]

// WhatsApp numbers — configurable from Settings (§5.13)
// Defaults shown; override via schoolStore / settings
const WHATSAPP_SUPPORT = '254700000000'   // AG Computer Solutions support
// const WHATSAPP_SCHOOL  = '254700000001' // school's own number (set in settings)

export default function GlobalFooter() {
  const waUrl = `https://wa.me/${WHATSAPP_SUPPORT}?text=Hi%2C%20I%20need%20help%20with%20InstaRatiba`

  return (
    <>
      {/* ── Fixed Footer Bar ── */}
      <footer
        className="fixed bottom-0 left-0 right-0 h-[52px] bg-white border-t border-[#e8eeeb]
                   flex items-center justify-center gap-4 z-[1000]
                   pb-[env(safe-area-inset-bottom)]"
        role="contentinfo"
      >
        <span className="text-[11px] text-muted font-medium">
          Powered by AG Computer Solutions
        </span>

        <span className="text-muted/30 text-xs">·</span>

        <div className="flex items-center gap-3" aria-label="Social media links">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.icon}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-muted hover:text-primary transition-colors duration-150"
            >
              <i className={`${s.icon} text-sm`} />
            </a>
          ))}
        </div>
      </footer>

      {/* ── Floating WhatsApp FAB — bottom-right, always visible ── */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Support"
        className="fixed bottom-[68px] right-5 w-12 h-12 rounded-full flex items-center justify-center
                   text-white text-xl z-[1001]
                   shadow-[0_4px_16px_rgba(37,211,102,0.40)]
                   hover:scale-105 hover:shadow-[0_6px_20px_rgba(37,211,102,0.50)]
                   transition-all duration-200"
        style={{ background: '#25D366' }}
      >
        <i className="bi-whatsapp" />
      </a>
    </>
  )
}
