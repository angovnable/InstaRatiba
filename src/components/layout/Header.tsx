import { useState, useEffect } from 'react'
import { Sun, Moon, Save, LogOut, User, FolderOpen, Loader2, WifiOff, Wifi, ChevronDown, Globe, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { AuthModal } from '@/components/ui/AuthModal'
import { T } from '@/lib/constants'
import type { DbTimetableRecord } from '@/types'

export function Header() {
  const {
    isDark, toggleTheme, userId, userEmail, userDisplayName, userPhoto,
    signOut, isSaving, saveTimetable, savedTimetables, loadTimetable,
    deleteTimetable, lang, setLang, isSyncing, lastSynced,
    authReady  // ← new
  } = useStore()
  const t = T[lang]

  const [showAuth, setShowAuth] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const displayName = userDisplayName || userEmail?.split('@')[0] || 'User'

  return (
    <>
      <header className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(18px)',
        paddingTop: 'max(0px, env(safe-area-inset-top))'
      }}>
        {/* Gold accent bar */}
        <div style={{ height: 2, background: 'var(--gold)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 5, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M6 8h20M6 14h13M6 20h15" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                <rect x="20" y="17" width="8" height="10" rx="2" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                InstaRatiba
              </div>
              <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }} className="header-tagline">
                CBC Timetables
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* Online status */}
            {!isOnline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-glow)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)', borderRadius: 20, padding: '3px 8px' }}>
                <WifiOff size={10} /> {t.offline}
              </div>
            )}
            {isOnline && lastSynced && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--success)', opacity: 0.8 }}>
                <Wifi size={10} />
              </div>
            )}

            {/* Language toggle */}
            <button
              className="btn btn-ghost"
              style={{ padding: '5px 8px', fontSize: 11, fontWeight: 700, gap: 4, border: '1px solid var(--border-default)', borderRadius: 7 }}
              onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              title="Switch language / Badilisha lugha"
            >
              <Globe size={12} />
              {lang === 'en' ? 'SW' : 'EN'}
            </button>

            {/* Save — only shown when logged in */}
            {userId && (
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => saveTimetable()} disabled={isSaving}>
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                <span className="hide-xs">{t.save}</span>
              </button>
            )}

            {/* Auth section — wait for redirect check before rendering */}
            {!authReady ? (
              // Placeholder keeps header layout stable while Firebase resolves
              <div style={{ width: 80, height: 34 }} />
            ) : userId ? (
              /* ── User menu ── */
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 10px', fontSize: 12, gap: 6 }}
                  onClick={() => setShowMenu(v => !v)}
                >
                  {userPhoto
                    ? <img src={userPhoto} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                    : <User size={13} />
                  }
                  <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hide-xs">
                    {displayName}
                  </span>
                  <ChevronDown size={11} />
                </button>

                {showMenu && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                    borderRadius: 12, padding: '6px', minWidth: 230, zIndex: 300,
                    boxShadow: 'var(--shadow-float)',
                    animation: 'slideDown 0.2s var(--ease-out) both'
                  }}>
                    {/* User info */}
                    <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{userEmail}</div>
                      {isSyncing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: 'var(--skyblue)' }}>
                          <Loader2 size={9} className="animate-spin" /> Syncing…
                        </div>
                      )}
                    </div>

                    {/* Saved timetables */}
                    <div style={{ padding: '4px 10px 6px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                        <FolderOpen size={10} style={{ display: 'inline', marginRight: 4 }} />Saved Timetables
                      </div>
                    </div>

                    {savedTimetables.length === 0 ? (
                      <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No saved timetables yet</div>
                    ) : (
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {savedTimetables.map((tt: DbTimetableRecord) => (
                          <div key={tt.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                            transition: 'background 0.1s'
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ flex: 1, minWidth: 0 }} onClick={() => { loadTimetable(tt); setShowMenu(false) }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tt.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {tt.updatedAt?.toDate ? tt.updatedAt.toDate().toLocaleDateString('en-KE') : 'Saved'}
                              </div>
                            </div>
                            <button className="btn btn-danger" style={{ padding: '3px 6px', fontSize: 10, marginLeft: 6, flexShrink: 0 }}
                              onClick={(e) => { e.stopPropagation(); deleteTimetable(tt.id) }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 4 }}>
                      <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 10px', fontSize: 12, color: 'var(--danger)' }}
                        onClick={() => { signOut(); setShowMenu(false) }}>
                        <LogOut size={13} /> {t.signOut}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Sign in button ── */
              <button className="btn btn-gold" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setShowAuth(true)}>
                <User size={13} /> {t.signIn}
              </button>
            )}

            {/* Theme */}
            <button
              className="btn btn-ghost"
              style={{ width: 34, height: 34, padding: 0, justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 8, flexShrink: 0 }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>

        {showMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setShowMenu(false)} />}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <style>{`
        @media (max-width: 480px) { .hide-xs { display: none !important; } }
        @media (min-width: 640px) { .header-tagline { display: block !important; } }
      `}</style>
    </>
  )
}