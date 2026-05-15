// ============================================================
// InstaRatiba — Segment 3
// Screen 2: School Setup Wizard (Step 1 of 5)
// ============================================================

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSchoolStore } from '@/store/schoolStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { upsertSchool } from '@/lib/supabase/school'
import { KENYA_COUNTIES, INDIGENOUS_LANGUAGES } from '@/types'
import type { School, SchoolLevel } from '@/types'
import { Button, Input, Card } from '@/components/ui'
import { WizardLayout } from '@/components/layout'

// ── Kenya Sub-County map (abbreviated — full map in production) ──
const SUB_COUNTIES: Record<string, string[]> = {
  Nairobi: ['Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra',
             'Roysambu', 'Kasarani', 'Ruaraka', 'Embakasi South', 'Embakasi North',
             'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara',
             'Kamukunji', 'Starehe', 'Mathare'],
  Kiambu:  ['Thika', 'Ruiru', 'Githunguri', 'Gatundu North', 'Gatundu South',
             'Juja', 'Limuru', 'Lari', 'Kiambaa', 'Kabete', 'Kikuyu', 'Ndumberi'],
  Mombasa: ['Changamwe', 'Jomvu', 'Kisauni', 'Nyali', 'Likoni', 'Mvita'],
  Nakuru:  ['Nakuru Town East', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Kuresoi North',
             'Kuresoi South', 'Molo', 'Njoro', 'Rongai', 'Subukia', 'Bahati'],
}

const LEVEL_LABELS: Record<SchoolLevel, string> = {
  lower_primary:    'Lower Primary (Grade 1–3)',
  upper_primary:    'Upper Primary (Grade 4–6)',
  junior_secondary: 'Junior Secondary (Grade 7–9)',
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

interface FormState {
  name: string
  county: string
  sub_county: string
  levels: SchoolLevel[]
  streams: Record<SchoolLevel, number>
  indigenous_language: string
  motto: string
  nemis_code: string
  academic_year: number
  current_term: 1 | 2 | 3
  climate_adjustment: boolean
  logo_file: File | null
  logo_preview: string | null
}

const DEFAULT_FORM: FormState = {
  name: '',
  county: '',
  sub_county: '',
  levels: [],
  streams: { lower_primary: 1, upper_primary: 1, junior_secondary: 1 },
  indigenous_language: '',
  motto: '',
  nemis_code: '',
  academic_year: CURRENT_YEAR,
  current_term: 1,
  climate_adjustment: false,
  logo_file: null,
  logo_preview: null,
}

interface FieldError { [k: string]: string }

function validate(form: FormState): FieldError {
  const e: FieldError = {}
  if (!form.name.trim())         e.name = 'School name is required'
  if (form.name.length > 80)     e.name = 'Max 80 characters'
  if (!form.county)              e.county = 'County is required'
  if (form.levels.length === 0)  e.levels = 'Select at least one school level'
  if (form.nemis_code && !/^\d{7}$/.test(form.nemis_code))
                                 e.nemis_code = 'NEMIS code must be 7 digits'
  return e
}

export default function SchoolSetupPage() {
  const navigate   = useNavigate()
  const { setSchool } = useSchoolStore()
  const { user, setHasCompletedSetup: setAuthSetup } = useAuthStore()
  const fileRef    = useRef<HTMLInputElement>(null)
  const [form, setForm]       = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors]   = useState<FieldError>({})
  const [saving, setSaving]   = useState(false)
  const [countySearch, setCountySearch] = useState('')

  // ── helpers ─────────────────────────────────────────────
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(p => ({ ...p, [key]: value }))

  const toggleLevel = (level: SchoolLevel) => {
    setForm(p => {
      const has = p.levels.includes(level)
      return { ...p, levels: has ? p.levels.filter(l => l !== level) : [...p.levels, level] }
    })
  }

  const filteredCounties = KENYA_COUNTIES.filter(c =>
    c.toLowerCase().includes(countySearch.toLowerCase())
  )
  const subCounties = SUB_COUNTIES[form.county] ?? []

  // ── Logo upload ─────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => set('logo_preview', ev.target?.result as string)
    reader.readAsDataURL(file)
    set('logo_file', file)
  }

  const removeLogo = () => {
    set('logo_file', null)
    set('logo_preview', null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Submit ───────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)

    try {
      // 1. Upload logo to Supabase Storage (if provided)
      let logo_url: string | undefined
      if (form.logo_file && user?.id) {
        const ext  = form.logo_file.name.split('.').pop()
        const path = `logos/${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('school-assets')
          .upload(path, form.logo_file, { upsert: true })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }

      // 2. Build School object
      const school: Partial<School> = {
        user_id:              user!.id,
        name:                 form.name.trim(),
        county:               form.county,
        sub_county:           form.sub_county || undefined,
        levels:               form.levels,
        motto:                form.motto.trim() || undefined,
        nemis_code:           form.nemis_code.trim() || undefined,
        logo_url,
        indigenous_language:  form.levels.includes('lower_primary')
                                ? form.indigenous_language || undefined
                                : undefined,
        academic_year:        form.academic_year,
        current_term:         form.current_term,
        climate_adjustment:   form.climate_adjustment,
      }

      // 3. Upsert to Supabase
      const saved = await upsertSchool(school)

      // 4. Update stores
      setSchool(saved)
      setAuthSetup(true)
      toast.success('School profile saved!')
      navigate('/setup/timing')
    } catch (err) {
      toast.error((err as Error & { message?: string }).message ?? 'Failed to save school profile')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <WizardLayout step={0} title="School Setup" subtitle="Tell us about your school">
      <div className="max-w-2xl mx-auto space-y-6 pb-24">

        {/* ── School Name ── */}
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-semibold text-[--color-text] flex items-center gap-2">
              <i className="bi bi-buildings text-[--color-primary]" />
              School Identity
            </h3>

            <Input
              label="School Name *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              error={errors.name}
              maxLength={80}
              placeholder="e.g. Sunshine Comprehensive School"
            />

            <Input
              label="School Motto (optional)"
              value={form.motto}
              onChange={e => set('motto', e.target.value)}
              placeholder="e.g. Excellence in Learning"
            />

            <Input
              label="NEMIS Code (optional)"
              value={form.nemis_code}
              onChange={e => set('nemis_code', e.target.value.replace(/\D/g, '').slice(0, 7))}
              error={errors.nemis_code}
              placeholder="7-digit number"
            />
          </div>
        </Card>

        {/* ── Logo Upload ── */}
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-semibold text-[--color-text] flex items-center gap-2">
              <i className="bi bi-image text-[--color-primary]" />
              School Logo
            </h3>
            <p className="text-xs text-[--color-muted]">
              PNG or JPG, max 2 MB. Printed on all exported timetables.
            </p>

            {form.logo_preview ? (
              <div className="flex items-center gap-4">
                <img src={form.logo_preview} alt="Logo preview"
                     className="w-20 h-20 object-contain rounded border border-[--color-surface]" />
                <Button variant="ghost" size="sm" onClick={removeLogo}>
                  <i className="bi bi-trash mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-[--color-accent-light] hover:border-[--color-primary] bg-[--color-surface] transition-colors cursor-pointer"
              >
                <i className="bi bi-cloud-upload text-2xl text-[--color-muted]" />
                <span className="mt-1 text-sm text-[--color-muted]">Click to upload logo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg"
                   className="hidden" onChange={handleLogoChange} />
          </div>
        </Card>

        {/* ── Location ── */}
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-semibold text-[--color-text] flex items-center gap-2">
              <i className="bi bi-geo-alt text-[--color-primary]" />
              Location
            </h3>

            {/* County dropdown with search */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                County *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.county || countySearch}
                  onChange={e => {
                    setCountySearch(e.target.value)
                    if (!e.target.value) set('county', '')
                  }}
                  placeholder="Search county…"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] border-[--color-accent-light]"
                />
                {countySearch && !form.county && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-[--color-accent-light] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCounties.length === 0
                      ? <p className="px-3 py-2 text-sm text-[--color-muted]">No counties found</p>
                      : filteredCounties.map(c => (
                          <button key={c} onClick={() => { set('county', c); setCountySearch(c); set('sub_county', '') }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[--color-surface]">
                            {c}
                          </button>
                        ))}
                  </div>
                )}
              </div>
              {errors.county && <p className="text-xs text-[--color-error]">{errors.county}</p>}
            </div>

            {/* Sub-county */}
            {subCounties.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                  Sub-County
                </label>
                <select
                  value={form.sub_county}
                  onChange={e => set('sub_county', e.target.value)}
                  className="w-full px-3 py-2 border border-[--color-accent-light] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white"
                >
                  <option value="">— Select sub-county —</option>
                  {subCounties.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* ── School Levels & Streams ── */}
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-semibold text-[--color-text] flex items-center gap-2">
              <i className="bi bi-diagram-3 text-[--color-primary]" />
              School Levels & Streams
            </h3>
            {errors.levels && (
              <p className="text-xs text-[--color-error]">{errors.levels}</p>
            )}

            <div className="space-y-3">
              {(Object.keys(LEVEL_LABELS) as SchoolLevel[]).map(level => {
                const active = form.levels.includes(level)
                return (
                  <motion.div key={level}
                    animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
                    <button
                      onClick={() => toggleLevel(level)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        active
                          ? 'border-[--color-primary] bg-[--color-surface]'
                          : 'border-[--color-accent-light] hover:border-[--color-mid]'
                      }`}
                    >
                      <span className="text-sm font-medium">{LEVEL_LABELS[level]}</span>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        active ? 'bg-[--color-primary] border-[--color-primary]' : 'border-[--color-muted]'
                      }`}>
                        {active && <i className="bi bi-check text-white text-xs" />}
                      </div>
                    </button>

                    {/* Stream count — only shown when level is selected */}
                    <AnimatePresence>
                      {active && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 ml-4 flex items-center gap-3">
                            <span className="text-xs text-[--color-muted]">Number of streams:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setForm(p => ({
                                  ...p,
                                  streams: { ...p.streams, [level]: Math.max(1, p.streams[level] - 1) }
                                }))}
                                className="w-7 h-7 rounded-full border border-[--color-accent-light] flex items-center justify-center hover:bg-[--color-surface] text-sm"
                              >−</button>
                              <span className="w-6 text-center text-sm font-semibold">
                                {form.streams[level]}
                              </span>
                              <button
                                onClick={() => setForm(p => ({
                                  ...p,
                                  streams: { ...p.streams, [level]: Math.min(12, p.streams[level] + 1) }
                                }))}
                                className="w-7 h-7 rounded-full border border-[--color-accent-light] flex items-center justify-center hover:bg-[--color-surface] text-sm"
                              >+</button>
                            </div>
                            <span className="text-xs text-[--color-muted]">
                              ({form.streams[level]} stream{form.streams[level] !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            {/* Indigenous language — Lower Primary only */}
            <AnimatePresence>
              {form.levels.includes('lower_primary') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1">
                    <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                      Indigenous Language (Grade 1–3)
                    </label>
                    <select
                      value={form.indigenous_language}
                      onChange={e => set('indigenous_language', e.target.value)}
                      className="w-full px-3 py-2 border border-[--color-accent-light] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white"
                    >
                      <option value="">— Select local language —</option>
                      {INDIGENOUS_LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <p className="text-xs text-[--color-muted]">
                      Used for subject labelling and timetable export.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* ── Academic Year & Term ── */}
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="text-base font-semibold text-[--color-text] flex items-center gap-2">
              <i className="bi bi-calendar3 text-[--color-primary]" />
              Academic Context
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                  Academic Year
                </label>
                <select
                  value={form.academic_year}
                  onChange={e => set('academic_year', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[--color-accent-light] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white"
                >
                  {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
                  Current Term
                </label>
                <select
                  value={form.current_term}
                  onChange={e => set('current_term', parseInt(e.target.value) as 1|2|3)}
                  className="w-full px-3 py-2 border border-[--color-accent-light] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white"
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
            </div>

            {/* Climate adjustment toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[--color-surface]">
              <div>
                <p className="text-sm font-medium">Climate Adjustment</p>
                <p className="text-xs text-[--color-muted]">
                  Enable custom start/end times (MoE allowance for climate zones)
                </p>
              </div>
              <button
                onClick={() => set('climate_adjustment', !form.climate_adjustment)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  form.climate_adjustment ? 'bg-[--color-primary]' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  form.climate_adjustment ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>
        </Card>

        {/* ── Action ── */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            loading={saving}
            onClick={handleSave}
            className="flex-1"
          >
            Save & Configure Timing <i className="bi bi-arrow-right ml-2" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  )
}
