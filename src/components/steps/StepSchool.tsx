import { Home, ChevronRight, Info, MapPin, Clock } from 'lucide-react'
import { useStore } from '@/store'
import { T } from '@/lib/constants'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]
const TERMS = ['Term 1', 'Term 2', 'Term 3']

const KE_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii',
  'Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera',
  'Marsabit','Meru','Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi',
  'Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita-Taveta','Tana River',
  'Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
]

export function StepSchool() {
  const { school, updateSchool, setStep, lang } = useStore()
  const t = T[lang]

  const termParts = school.term?.split(' ') ?? ['Term', '1', String(CURRENT_YEAR)]
  const termLabel = `${termParts[0]} ${termParts[1]}`
  const termYear  = termParts[2] ?? String(CURRENT_YEAR)

  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{text}</label>
  )

  return (
    <section className="animate-fade-in">
      {/* Hero banner */}
      <div className="school-bg" style={{ borderRadius: 16, marginBottom: 20, padding: '28px 24px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(212,160,23,0.2)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={24} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {t.schoolSetup}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 3 }}>
                {lang === 'sw' ? 'Sanidi maelezo ya shule yako na muundo wa ratiba' : 'Configure your school\'s info and timetable structure'}
              </p>
            </div>
          </div>
          {/* Decorative school icons */}
          <div style={{ position: 'absolute', right: 20, top: 10, opacity: 0.07, fontSize: 64, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>🏫</div>
          <div style={{ position: 'absolute', right: 80, bottom: 5, opacity: 0.05, fontSize: 40, userSelect: 'none', pointerEvents: 'none' }}>📚</div>
        </div>
      </div>

      {/* School Info */}
      <div className="card animate-slide-up" style={{ marginBottom: 16, animationDelay: '0.05s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 6, height: 20, borderRadius: 3, background: 'var(--gold)' }} />
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {lang === 'sw' ? 'Maelezo ya Shule' : 'School Information'}
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            {lbl(lang === 'sw' ? 'Jina la Shule *' : 'School Name *')}
            <input type="text" className="input-field" placeholder={lang === 'sw' ? 'mfano: Nairobi JSS' : 'e.g. Nairobi JSS'}
              value={school.name} onChange={e => updateSchool({ name: e.target.value })} autoComplete="organization" />
          </div>
          <div>
            {lbl('County')}
            <select className="input-field" value={school.county} onChange={e => updateSchool({ county: e.target.value })}>
              <option value="">— {lang === 'sw' ? 'Chagua kaunti' : 'Select county'} —</option>
              {KE_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            {lbl(lang === 'sw' ? 'Muhula *' : 'Term *')}
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="input-field" value={termLabel} onChange={e => updateSchool({ term: `${e.target.value} ${termYear}` })} style={{ flex: 1 }}>
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="input-field" value={termYear} onChange={e => updateSchool({ term: `${termLabel} ${e.target.value}` })} style={{ width: 88 }}>
                {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            {lbl(lang === 'sw' ? 'Ngazi ya Shule' : 'School Level')}
            <select className="input-field" value={school.level} onChange={e => updateSchool({ level: e.target.value as any })}>
              <option value="jss">Junior Secondary (Grades 7–9)</option>
              <option value="primary">Primary (Grades 1–6)</option>
              <option value="both">Both Primary &amp; JSS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Structure */}
      <div className="card animate-slide-up" style={{ marginBottom: 16, animationDelay: '0.10s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 6, height: 20, borderRadius: 3, background: 'var(--skyblue)' }} />
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {lang === 'sw' ? 'Muundo wa Wakati' : 'Time Structure'}
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            {lbl('JSS Start')}
            <input type="time" className="input-field" value={school.startTime} onChange={e => updateSchool({ startTime: e.target.value })} />
          </div>
          <div>
            {lbl('JSS End')}
            <input type="time" className="input-field" value={school.endTime} onChange={e => updateSchool({ endTime: e.target.value })} />
          </div>
          <div>
            {lbl('JSS Lesson Duration')}
            <select className="input-field" value={school.lessonDurationJSS} onChange={e => updateSchool({ lessonDurationJSS: +e.target.value })}>
              <option value={35}>35 min</option>
              <option value={40}>40 min (MoE standard)</option>
              <option value={45}>45 min</option>
            </select>
          </div>
          <div>
            {lbl('Primary Lesson')}
            <select className="input-field" value={school.lessonDurationPrimary} onChange={e => updateSchool({ lessonDurationPrimary: +e.target.value })}>
              <option value={30}>30 min</option>
              <option value={35}>35 min (MoE standard)</option>
              <option value={40}>40 min</option>
            </select>
          </div>
        </div>

        {/* Live preview bar */}
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Clock size={13} style={{ color: 'var(--skyblue)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>School day: </strong>
            {school.startTime || '08:20'} → {school.endTime || '16:00'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>JSS lesson: </strong>
            {school.lessonDurationJSS} min
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Term: </strong>
            {school.term}
          </span>
        </div>

        <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid color-mix(in srgb, var(--skyblue) 25%, transparent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: 'var(--skyblue)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>MoE Standard (JSS):</strong> 9 lessons/day × 5 days = 45 periods/week (§4.2.1). Tea break: 9:40–10:00 · Lunch: 12:00–12:40. PPI locked to Friday last slot.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-gold animate-slide-up" onClick={() => setStep(1)} style={{ padding: '12px 28px', fontSize: 14, animationDelay: '0.15s' }}>
          {lang === 'sw' ? 'Ijayo: Madarasa' : 'Next: Classes'} <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )
}
