// GlobalFooter — Emil Kowalski: absolutely minimal.
// A single hairline line and a byline. Nothing more.

const SOCIAL = [
  { icon: 'bi-facebook',  href: '#', label: 'Facebook' },
  { icon: 'bi-instagram', href: '#', label: 'Instagram' },
  { icon: 'bi-twitter-x', href: '#', label: 'X' },
  { icon: 'bi-linkedin',  href: '#', label: 'LinkedIn' },
]

export default function GlobalFooter() {
  return (
    <>
      <footer
        className="no-print"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 48,
          background: 'rgba(247,245,239,0.94)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(13,61,35,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <span style={{
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.68rem',
          color: '#7A8C82',
        }}>
          © {new Date().getFullYear()} <span style={{ color: '#0D3D23', fontWeight: 500 }}>AG Computer Solutions</span>
        </span>

        <span style={{ width: 1, height: 10, background: '#EDE7D9' }} />

        <div style={{ display: 'flex', gap: 14 }}>
          {SOCIAL.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              style={{
                color: '#C8C0B0',
                fontSize: '0.78rem',
                textDecoration: 'none',
                transition: 'color 120ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C8922A' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C8C0B0' }}
            >
              <i className={s.icon} />
            </a>
          ))}
        </div>
      </footer>

      {/* WhatsApp FAB — precise, not garish */}
      <a
        href={`https://wa.me/254700000000?text=Hi%2C+I+need+help+with+InstaRatiba`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp support"
        className="no-print"
        style={{
          position: 'fixed',
          bottom: 64,
          right: 20,
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.1rem',
          textDecoration: 'none',
          zIndex: 200,
          boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
          transition: 'transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 180ms',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.transform = 'scale(1.1)'
          el.style.boxShadow = '0 4px 16px rgba(37,211,102,0.45)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.transform = 'scale(1)'
          el.style.boxShadow = '0 2px 8px rgba(37,211,102,0.35)'
        }}
      >
        <i className="bi-whatsapp" />
      </a>
    </>
  )
}
