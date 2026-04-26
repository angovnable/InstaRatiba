import { Home, ChevronRight, Info, MapPin, Clock } from 'lucide-react'
import { useStore } from '@/store'
import { T, buildSlots } from '@/lib/constants'

import type { TimeSlot } from '@/lib/constants'

function SchedulePreview({ label, accentColor, slots, lessonDuration }: {
  label: string
  accentColor: string
  slots: TimeSlot[]
  lessonDuration: number
}) {
  const lessons = slots.filter(s => s.type === 'lesson')
  return (
    <div style={{ border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: `2px solid ${accentColor}`, background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accentColor }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{lessonDuration} min · {lessons.length} lessons/day</span>
      </div>
      {/* Slots */}
      <div style={{ background: 'var(--bg-surface)' }}>
        {slots.map((slot, i) => {
          const isBreak = slot.type === 'break'
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              padding: isBreak ? '5px 12px' : '4px 12px',
              background: isBreak ? 'var(--break-bg)' : 'transparent',
              borderBottom: i < slots.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              gap: 10,
            }}>
              {/* Time */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: isBreak ? 'var(--text-muted)' : 'var(--text-primary)',
                fontWeight: isBreak ? 400 : 500,
                minWidth: 100,
                flexShrink: 0,
              }}>
                {slot.time}
              </span>
              {/* Label pill */}
              {isBreak ? (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  — {slot.label} —
                </span>
              ) : (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '1px 7px', borderRadius: 3,
                  background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                  color: accentColor,
                  border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
                }}>
                  {slot.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
            {lang === 'sw' ? 'Muundo wa Wakati' : 'Schedule & Timing'}
          </h3>
        </div>

        {/* JSS Schedule */}
        {(school.level === 'jss' || school.level === 'both') && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--skyblue)', marginBottom: 10 }}>
              JSS (Grades 7–9)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                {lbl('Start Time')}
                <input type="time" className="input-field" value={school.startTime}
                  onChange={e => updateSchool({ startTime: e.target.value })} />
              </div>
              <div>
                {lbl('End Time')}
                <input type="time" className="input-field" value={school.endTime}
                  onChange={e => updateSchool({ endTime: e.target.value })} />
              </div>
              <div>
                {lbl('Lesson Duration')}
                <select className="input-field" value={school.lessonDurationJSS}
                  onChange={e => updateSchool({ lessonDurationJSS: +e.target.value })}>
                  <option value={35}>35 min</option>
                  <option value={40}>40 min (MoE standard)</option>
                  <option value={45}>45 min</option>
                </select>
              </div>
              <div>
                {lbl('Tea Break Start')}
                <input type="time" className="input-field" value={school.teaBreakStartJSS}
                  onChange={e => updateSchool({ teaBreakStartJSS: e.target.value })} />
              </div>
              <div>
                {lbl('Tea Break End')}
                <input type="time" className="input-field" value={school.teaBreakEndJSS}
                  onChange={e => updateSchool({ teaBreakEndJSS: e.target.value })} />
              </div>
              <div>
                {lbl('Lunch Start')}
                <input type="time" className="input-field" value={school.lunchStartJSS}
                  onChange={e => updateSchool({ lunchStartJSS: e.target.value })} />
              </div>
              <div>
                {lbl('Lunch End')}
                <input type="time" className="input-field" value={school.lunchEndJSS}
                  onChange={e => updateSchool({ lunchEndJSS: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* Upper/Lower Primary Schedule */}
        {(school.level === 'primary' || school.level === 'both') && (
          <div style={{ borderTop: school.level === 'both' ? '1px solid var(--border-subtle)' : 'none', paddingTop: school.level === 'both' ? 16 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>
              Primary (Grades 1–6)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                {lbl('Start Time')}
                <input type="time" className="input-field" value={school.startTimePrimary ?? '08:00'}
                  onChange={e => updateSchool({ startTimePrimary: e.target.value })} />
              </div>
              <div>
                {lbl('End Time')}
                <input type="time" className="input-field" value={school.endTimePrimary ?? '15:30'}
                  onChange={e => updateSchool({ endTimePrimary: e.target.value })} />
              </div>
              <div>
                {lbl('Lesson Duration')}
                <select className="input-field" value={school.lessonDurationPrimary}
                  onChange={e => updateSchool({ lessonDurationPrimary: +e.target.value })}>
                  <option value={30}>30 min</option>
                  <option value={35}>35 min (MoE standard)</option>
                  <option value={40}>40 min</option>
                </select>
              </div>
              <div>
                {lbl('Tea Break Start')}
                <input type="time" className="input-field" value={school.teaBreakStartPrimary ?? '10:00'}
                  onChange={e => updateSchool({ teaBreakStartPrimary: e.target.value })} />
              </div>
              <div>
                {lbl('Tea Break End')}
                <input type="time" className="input-field" value={school.teaBreakEndPrimary ?? '10:20'}
                  onChange={e => updateSchool({ teaBreakEndPrimary: e.target.value })} />
              </div>
              <div>
                {lbl('Lunch Start')}
                <input type="time" className="input-field" value={school.lunchStartPrimary ?? '12:30'}
                  onChange={e => updateSchool({ lunchStartPrimary: e.target.value })} />
              </div>
              <div>
                {lbl('Lunch End')}
                <input type="time" className="input-field" value={school.lunchEndPrimary ?? '13:00'}
                  onChange={e => updateSchool({ lunchEndPrimary: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* Live Schedule Preview */}
        <div style={{ marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={13} style={{ color: 'var(--skyblue)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Daily Schedule Preview
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: (school.level === 'both') ? '1fr 1fr' : '1fr', gap: 12 }}>
            {(school.level === 'jss' || school.level === 'both') && (
              <SchedulePreview
                label="JSS (Grades 7–9)"
                accentColor="var(--skyblue)"
                lessonDuration={school.lessonDurationJSS}
                slots={buildSlots({
                  startTime: school.startTime,
                  lessonDuration: school.lessonDurationJSS,
                  teaBreakStart: school.teaBreakStartJSS,
                  teaBreakEnd: school.teaBreakEndJSS,
                  lunchStart: school.lunchStartJSS,
                  lunchEnd: school.lunchEndJSS,
                  endTime: school.endTime,
                })}
              />
            )}
            {(school.level === 'primary' || school.level === 'both') && (
              <SchedulePreview
                label="Upper Primary (Grades 4–6)"
                accentColor="var(--gold)"
                lessonDuration={school.lessonDurationPrimary}
                slots={buildSlots({
                  startTime: school.startTimePrimary ?? '08:00',
                  lessonDuration: school.lessonDurationPrimary,
                  teaBreakStart: school.teaBreakStartPrimary ?? '10:00',
                  teaBreakEnd: school.teaBreakEndPrimary ?? '10:20',
                  lunchStart: school.lunchStartPrimary ?? '12:30',
                  lunchEnd: school.lunchEndPrimary ?? '13:00',
                  endTime: school.endTimePrimary ?? '15:30',
                })}
              />
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid color-mix(in srgb, var(--skyblue) 25%, transparent)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: 'var(--skyblue)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Morning priority:</strong> Maths, English, Kiswahili/KSL & Integrated Science are scheduled in morning slots. Double consecutive lessons applied to Pre-Technical, Integrated Science & Agriculture.
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