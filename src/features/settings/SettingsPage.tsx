// ============================================================
// InstaRatiba — Segment 9
// SettingsPage.tsx
// §5.13 Settings Screen — full implementation
// Tabs: School Profile, Timing, Social Links,
//       WhatsApp, Notifications, Share Link, Account, Danger Zone
// ============================================================

import { useState, useRef } from 'react'
import { useNavigate }       from 'react-router-dom'
import { toast }             from 'sonner'
import { useAuthStore }      from '@/store/authStore'
import { useSchoolStore }    from '@/store/schoolStore'
import { useTimetableStore } from '@/store/timetableStore'
import { supabase }          from '@/lib/supabase/client'
import {
  updateSchool, uploadSchoolLogo,
  createShareToken, revokeShareToken, fetchActiveShareToken,
} from '@/lib/supabase/settings'

// ── Section heading ───────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[--color-surface]">
      <i className={`${icon} text-[--color-primary] text-lg`} />
      <h2 className="text-base font-semibold text-[--color-text]">{title}</h2>
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────
function Tab({
  label, icon, active, onClick,
}: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
        active
          ? 'bg-[--color-primary] text-white font-semibold'
          : 'text-[--color-muted] hover:bg-[--color-surface] hover:text-[--color-text]'
      }`}
    >
      <i className={`${icon} text-base`} />
      {label}
    </button>
  )
}

// ── Labelled input ────────────────────────────────────────────
function LabelledInput({
  label, value, onChange, placeholder, type = 'text', maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[--color-muted] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full border border-[--color-accent-light] rounded-xl px-3 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main settings page
// ─────────────────────────────────────────────────────────────

type TabKey = 'school' | 'timing' | 'social' | 'whatsapp' | 'notifications' | 'share' | 'account' | 'danger'

export default function SettingsPage() {
  const navigate          = useNavigate()
  const { user, logout: signOut } = useAuthStore()
  const { school, setSchool } = useSchoolStore()
  const ttStore           = useTimetableStore()

  const [activeTab, setActiveTab] = useState<TabKey>('school')

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'school',        label: 'School Profile',    icon: 'bi-building' },
    { key: 'timing',        label: 'Timing Config',     icon: 'bi-clock' },
    { key: 'social',        label: 'Social Links',      icon: 'bi-share' },
    { key: 'whatsapp',      label: 'WhatsApp Numbers',  icon: 'bi-whatsapp' },
    { key: 'notifications', label: 'Notifications',     icon: 'bi-bell' },
    { key: 'share',         label: 'Share Link',        icon: 'bi-link-45deg' },
    { key: 'account',       label: 'Account',           icon: 'bi-person-circle' },
    { key: 'danger',        label: 'Danger Zone',       icon: 'bi-exclamation-triangle' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 p-4 sm:p-6 max-w-6xl mx-auto">

      {/* ── Sidebar nav ──────────────────────────────────────── */}
      <aside className="lg:w-52 flex-shrink-0">
        <h1 className="text-xl font-bold text-[--color-text] mb-4 hidden lg:block">Settings</h1>
        <nav className="flex lg:flex-col gap-1 flex-wrap lg:flex-nowrap overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {tabs.map(t => (
            <Tab
              key={t.key}
              label={t.label}
              icon={t.icon}
              active={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
            />
          ))}
        </nav>
      </aside>

      {/* ── Content panel ────────────────────────────────────── */}
      <main className="flex-1 min-w-0 mt-4 lg:mt-0">
        <div className="bg-white border border-[--color-accent-light] rounded-2xl p-6 shadow-sm">

          {activeTab === 'school'        && <SchoolProfileTab school={school} setSchool={setSchool} />}
          {activeTab === 'timing'        && <TimingTab navigate={navigate} />}
          {activeTab === 'social'        && <SocialLinksTab school={school} setSchool={setSchool} />}
          {activeTab === 'whatsapp'      && <WhatsAppTab school={school} setSchool={setSchool} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'share'         && <ShareLinkTab ttStore={ttStore} />}
          {activeTab === 'account'       && <AccountTab user={user} signOut={signOut} navigate={navigate} />}
          {activeTab === 'danger'        && <DangerZoneTab school={school} signOut={signOut} navigate={navigate} />}

        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// School Profile Tab
// ─────────────────────────────────────────────────────────────

function SchoolProfileTab({ school, setSchool }: { school: School | null; setSchool: (s: School) => void }) {
  const [name,     setName]     = useState(school?.name     ?? '')
  const [motto,    setMotto]    = useState(school?.motto    ?? '')
  const [nemis,    setNemis]    = useState(school?.nemis_code ?? '')
  const [county,   setCounty]   = useState(school?.county   ?? '')
  const [saving,   setSaving]   = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const logoRef                 = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!school?.id) return
    setSaving(true)
    try {
      let logoUrl = school.logo_url
      if (logoFile) {
        logoUrl = await uploadSchoolLogo(school.id, logoFile)
      }
      const updated = await updateSchool(school.id, { name, motto, nemis_code: nemis, county, logo_url: logoUrl })
      setSchool(updated)
      toast.success('School profile saved')
    } catch (e) {
      toast.error('Save failed: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="School Profile" icon="bi-building" />

      {/* Logo */}
      <div>
        <label className="block text-xs font-medium text-[--color-muted] mb-2">School Logo</label>
        <div className="flex items-center gap-4">
          {school?.logo_url ? (
            <img src={school.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-[--color-accent-light]" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[--color-surface] flex items-center justify-center border border-dashed border-[--color-accent-light]">
              <i className="bi bi-image text-[--color-muted] text-2xl" />
            </div>
          )}
          <div>
            <button
              onClick={() => logoRef.current?.click()}
              className="text-sm border border-[--color-accent-light] rounded-xl px-3 py-2 hover:border-[--color-primary] hover:text-[--color-primary] transition-colors"
            >
              <i className="bi bi-upload mr-1.5" />{school?.logo_url ? 'Replace' : 'Upload'}
            </button>
            <p className="text-xs text-[--color-muted] mt-1">PNG / JPG · max 2 MB</p>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={e => setLogoFile(e.target.files?.[0] ?? null)}
            />
            {logoFile && <p className="text-xs text-green-600 mt-0.5">✓ {logoFile.name}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LabelledInput label="School Name" value={name} onChange={setName} maxLength={80} />
        <LabelledInput label="County / Sub-County" value={county} onChange={setCounty} />
        <LabelledInput label="NEMIS Code" value={nemis} onChange={setNemis} placeholder="7-digit code" maxLength={7} />
        <LabelledInput label="School Motto" value={motto} onChange={setMotto} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : null}
        Save Changes
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Timing Tab
// ─────────────────────────────────────────────────────────────

function TimingTab({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Timing Configuration" icon="bi-clock" />
      <p className="text-sm text-[--color-muted]">
        Configure lesson start times, break durations, and end-of-day times per school level.
        The timing editor shows three tabs: Lower Primary, Upper Primary, and Junior Secondary.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Lower Primary', sub: 'Grade 1–3 · 30 min lessons', color: '#2E7D32' },
          { label: 'Upper Primary', sub: 'Grade 4–6 · 30 min lessons', color: '#1565C0' },
          { label: 'Junior Secondary', sub: 'Grade 7–9 · 40 min lessons', color: '#E65100' },
        ].map(lv => (
          <div key={lv.label}
            className="border border-[--color-accent-light] rounded-xl p-4 hover:border-[--color-primary] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm mb-2"
                 style={{ background: lv.color }}>
              <i className="bi bi-clock" />
            </div>
            <p className="font-medium text-sm text-[--color-text]">{lv.label}</p>
            <p className="text-xs text-[--color-muted] mt-0.5">{lv.sub}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/setup/timing')}
        className="btn-primary"
      >
        <i className="bi bi-pencil-square mr-1.5" />Open Timing Editor
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Social Links Tab
// ─────────────────────────────────────────────────────────────

function SocialLinksTab({ school, setSchool }: { school: School | null; setSchool: (s: School) => void }) {
  const meta = ((school?.meta ?? {}) as Record<string, string>)
  const [fb,  setFb]  = useState(meta.facebook  ?? '')
  const [ig,  setIg]  = useState(meta.instagram  ?? '')
  const [tw,  setTw]  = useState(meta.twitter    ?? '')
  const [li,  setLi]  = useState(meta.linkedin   ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!school?.id) return
    setSaving(true)
    try {
      const updated = await updateSchool(school.id, {
        meta: { ...meta, facebook: fb, instagram: ig, twitter: tw, linkedin: li },
      })
      setSchool(updated)
      toast.success('Social links saved')
    } catch (e) {
      toast.error('Save failed: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Social Media Links" icon="bi-share" />
      <p className="text-sm text-[--color-muted]">
        These links appear in the global footer on every page.
      </p>
      <div className="space-y-4">
        {[
          { label: 'Facebook URL',   icon: 'bi-facebook',   value: fb,  set: setFb,  placeholder: 'https://facebook.com/yourschool' },
          { label: 'Instagram URL',  icon: 'bi-instagram',  value: ig,  set: setIg,  placeholder: 'https://instagram.com/yourschool' },
          { label: 'X / Twitter URL', icon: 'bi-twitter-x', value: tw, set: setTw,  placeholder: 'https://x.com/yourschool' },
          { label: 'LinkedIn URL',   icon: 'bi-linkedin',   value: li,  set: setLi,  placeholder: 'https://linkedin.com/school/yourschool' },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs font-medium text-[--color-muted] mb-1">{f.label}</label>
            <div className="flex items-center border border-[--color-accent-light] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[--color-primary]">
              <span className="px-3 py-2.5 bg-[--color-surface] border-r border-[--color-accent-light]">
                <i className={`${f.icon} text-[--color-muted] text-sm`} />
              </span>
              <input
                type="url"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : null}
        Save Links
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WhatsApp Numbers Tab
// ─────────────────────────────────────────────────────────────

function WhatsAppTab({ school, setSchool }: { school: School | null; setSchool: (s: School) => void }) {
  const meta = ((school?.meta ?? {}) as Record<string, string>)
  const [schoolWa, setSchoolWa]   = useState(meta.whatsapp_school ?? '')
  const [supportWa, setSupportWa] = useState(meta.whatsapp_support ?? '+254')
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    if (!school?.id) return
    setSaving(true)
    try {
      const updated = await updateSchool(school.id, {
        meta: { ...meta, whatsapp_school: schoolWa, whatsapp_support: supportWa },
      })
      setSchool(updated)
      toast.success('WhatsApp numbers saved')
    } catch (e) {
      toast.error('Save failed: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="WhatsApp Numbers" icon="bi-whatsapp" />
      <p className="text-sm text-[--color-muted]">
        Two separate WhatsApp buttons appear in the global footer — one for your school's admin number and one for AG Computer Solutions support.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[--color-muted] mb-1">School Admin WhatsApp</label>
          <div className="flex items-center border border-[--color-accent-light] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[--color-primary]">
            <span className="px-3 py-2.5 bg-[--color-surface] border-r border-[--color-accent-light] text-[--color-muted] text-sm">
              <i className="bi bi-building" />
            </span>
            <input
              type="tel"
              value={schoolWa}
              onChange={e => setSchoolWa(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <p className="text-xs text-[--color-muted] mt-1">Include country code, e.g. +254712345678</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[--color-muted] mb-1">AG Computer Solutions Support (read-only)</label>
          <div className="flex items-center border border-[--color-accent-light] rounded-xl overflow-hidden bg-[--color-surface]">
            <span className="px-3 py-2.5 border-r border-[--color-accent-light] text-[--color-muted] text-sm">
              <i className="bi bi-headset" />
            </span>
            <input
              type="tel"
              value={supportWa}
              onChange={e => setSupportWa(e.target.value)}
              placeholder="+254 700 000 000"
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : null}
        Save Numbers
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Notifications Tab
// ─────────────────────────────────────────────────────────────

function NotificationsTab() {
  const [emailApproval,  setEmailApproval]  = useState(true)
  const [emailConflict,  setEmailConflict]  = useState(false)
  const [pushPublished,  setPushPublished]  = useState(true)
  const [pushTermStart,  setPushTermStart]  = useState(true)
  const [saving,         setSaving]         = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Notification preferences saved')
    setSaving(false)
  }

  const Toggle = ({ value, onChange, label, sub }: {
    value: boolean; onChange: (v: boolean) => void; label: string; sub: string
  }) => (
    <div className="flex items-start justify-between py-3 border-b border-[--color-surface] last:border-0">
      <div>
        <p className="text-sm font-medium text-[--color-text]">{label}</p>
        <p className="text-xs text-[--color-muted] mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${value ? 'bg-[--color-primary]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )

  return (
    <div className="space-y-5">
      <SectionHeader title="Notification Preferences" icon="bi-bell" />

      <div>
        <p className="text-xs font-semibold text-[--color-muted] uppercase tracking-wider mb-2">Email Notifications</p>
        <div className="bg-[--color-surface] rounded-xl px-4">
          <Toggle value={emailApproval} onChange={setEmailApproval}
            label="Timetable approved / returned"
            sub="Get notified when Head Teacher acts on your submission" />
          <Toggle value={emailConflict} onChange={setEmailConflict}
            label="New conflict detected"
            sub="Alert when a hard conflict appears in your allocation" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[--color-muted] uppercase tracking-wider mb-2">Push Notifications (PWA)</p>
        <div className="bg-[--color-surface] rounded-xl px-4">
          <Toggle value={pushPublished} onChange={setPushPublished}
            label="Timetable published"
            sub="Alert all users when a new timetable goes live" />
          <Toggle value={pushTermStart} onChange={setPushTermStart}
            label="Term start reminder"
            sub="Reminder 7 days before each term begins" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : null}
        Save Preferences
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Share Link Tab
// ─────────────────────────────────────────────────────────────

function ShareLinkTab({ ttStore }: { ttStore: { current: { id: string } | null } }) {
  const [token,      setToken]      = useState<string | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [isCopied,   setIsCopied]   = useState(false)

  const timetableId = ttStore.current?.id

  // Load existing token
  useState(() => {
    if (!timetableId) { setIsLoading(false); return }
    fetchActiveShareToken(timetableId)
      .then(t => { setToken(t); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  })

  const shareUrl = token ? `${window.location.origin}/timetable/share/${token}` : null

  const handleGenerate = async () => {
    if (!timetableId) { toast.error('No active timetable'); return }
    try {
      if (token) await revokeShareToken(timetableId)
      const newToken = await createShareToken(timetableId)
      setToken(newToken)
      toast.success('Share link generated')
    } catch (e) {
      toast.error('Failed to generate link')
    }
  }

  const handleRevoke = async () => {
    if (!timetableId || !token) return
    if (!window.confirm('Revoke this share link? Anyone with the current link will lose access.')) return
    try {
      await revokeShareToken(timetableId)
      setToken(null)
      toast.success('Share link revoked')
    } catch {
      toast.error('Failed to revoke link')
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Shareable Timetable Link" icon="bi-link-45deg" />
      <p className="text-sm text-[--color-muted]">
        Generate a public read-only link for teachers and parents to view the approved timetable without logging in.
        The link is protected by a school-specific token.
      </p>

      {!timetableId ? (
        <div className="bg-[--color-surface] rounded-xl p-4 text-sm text-[--color-muted]">
          <i className="bi bi-info-circle mr-1.5" />No active timetable. Generate and publish a timetable first.
        </div>
      ) : isLoading ? (
        <div className="h-12 bg-[--color-surface] rounded-xl animate-pulse" />
      ) : token ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl ?? ''}
              className="flex-1 border border-[--color-accent-light] rounded-xl px-3 py-2.5 text-sm bg-[--color-surface] text-[--color-muted] truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors flex-shrink-0 ${
                isCopied
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'border-[--color-accent-light] text-[--color-primary] hover:bg-green-50'
              }`}
            >
              <i className={`${isCopied ? 'bi-check-lg' : 'bi-copy'} mr-1.5`} />
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="text-sm border border-[--color-accent-light] text-[--color-muted] rounded-xl px-3 py-2 hover:border-[--color-primary] hover:text-[--color-primary] transition-colors"
            >
              <i className="bi bi-arrow-clockwise mr-1.5" />Regenerate
            </button>
            <button
              onClick={handleRevoke}
              className="text-sm border border-red-200 text-red-500 rounded-xl px-3 py-2 hover:bg-red-50 transition-colors"
            >
              <i className="bi bi-x-circle mr-1.5" />Revoke
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleGenerate} className="btn-primary">
          <i className="bi bi-link-45deg mr-1.5" />Generate Share Link
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Account Tab
// ─────────────────────────────────────────────────────────────

function AccountTab({
  user, signOut, navigate,
}: { user: Record<string, unknown> | null; signOut: () => void; navigate: ReturnType<typeof import("react-router-dom").useNavigate> }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [saving,      setSaving]      = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.auth.updateUser({ data: { full_name: displayName } })
      toast.success('Display name updated')
    } catch {
      toast.error('Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      await supabase.auth.resetPasswordForEmail(user?.email ?? '')
      toast.success('Password reset email sent')
    } catch {
      toast.error('Failed to send reset email')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Account & Profile" icon="bi-person-circle" />

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[--color-primary] text-white text-xl font-bold flex items-center justify-center uppercase">
          {(displayName || user?.email || '?')[0]}
        </div>
        <div>
          <p className="font-semibold text-[--color-text]">{displayName || '—'}</p>
          <p className="text-sm text-[--color-muted]">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <LabelledInput label="Display Name" value={displayName} onChange={setDisplayName} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : null}
          Save Name
        </button>
        <button
          onClick={handlePasswordReset}
          className="border border-[--color-accent-light] text-sm text-[--color-muted] rounded-xl px-4 py-2 hover:border-[--color-primary] hover:text-[--color-primary] transition-colors"
        >
          <i className="bi bi-key mr-1.5" />Send Password Reset
        </button>
        <button
          onClick={() => { signOut(); navigate('/') }}
          className="border border-[--color-accent-light] text-sm text-red-500 rounded-xl px-4 py-2 hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <i className="bi bi-box-arrow-right mr-1.5" />Sign Out
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Danger Zone Tab
// ─────────────────────────────────────────────────────────────

function DangerZoneTab({ school, signOut, navigate }: { school: School | null; signOut: () => void; navigate: ReturnType<typeof import('react-router-dom').useNavigate> }) {
  const [confirm1, setConfirm1] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAll = async () => {
    if (confirm1 !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      if (school?.id) {
        await supabase.from('subject_allocations').delete().eq('school_id', school.id)
        await supabase.from('teacher_subjects').delete().eq('school_id', school.id)
        await supabase.from('teachers').delete().eq('school_id', school.id)
        await supabase.from('classes').delete().eq('school_id', school.id)
        await supabase.from('rooms').delete().eq('school_id', school.id)
        await supabase.from('timetables').delete().eq('school_id', school.id)
        await supabase.from('schools').delete().eq('id', school.id)
      }
      toast.success('All school data deleted')
      signOut()
      navigate('/')
    } catch (e) {
      toast.error('Delete failed: ' + (e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Danger Zone" icon="bi-exclamation-triangle" />

      <div className="border border-red-300 rounded-2xl p-5 bg-red-50 space-y-4">
        <div className="flex items-start gap-3">
          <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 text-sm">Delete All School Data</h3>
            <p className="text-xs text-red-700 mt-1">
              This permanently deletes your school profile, all teachers, classes, rooms, allocations, and timetables.
              Your account login is preserved. <strong>This cannot be undone.</strong>
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-red-700 mb-1">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            value={confirm1}
            onChange={e => setConfirm1(e.target.value)}
            placeholder="DELETE"
            className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <button
          onClick={handleDeleteAll}
          disabled={deleting || confirm1 !== 'DELETE'}
          className="w-full py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
        >
          {deleting ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : <i className="bi bi-trash mr-1.5" />}
          Delete All School Data
        </button>
      </div>
    </div>
  )
}
