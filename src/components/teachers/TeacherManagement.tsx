import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useSchoolStore } from '@/store/schoolStore'
import { useTeacherStore } from '@/store/teacherStore'
import { fetchTeachers, fetchAllTeacherSubjects } from '@/lib/supabase/teachers'
import { fetchAllocations } from '@/lib/supabase/allocations'
import { Button, Input, Card, Badge, SkeletonLoader } from '@/components/ui'
import type { Teacher, TeacherSubject, SubjectAllocation } from '@/types'
import type { AttendanceStatus, GenderType } from '@/types/school'

// ── Types ────────────────────────────────────────────────────

interface TeacherAttendance {
  id?: string
  teacher_id: string
  school_id: string
  date: string
  status: AttendanceStatus
}

// ── Components ───────────────────────────────────────────────

export default function TeacherManagement() {
  const { school, classes } = useSchoolStore()
  const { 
    teachers, setTeachers, 
    teacherSubjects, setTeacherSubjects,
    isLoading, setLoading 
  } = useTeacherStore()

  const [allocations, setAllocations] = useState<SubjectAllocation[]>([])
  const [activeTab, setActiveTab]     = useState<'directory' | 'attendance'>('directory')
  
  // Attendance States
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // Filter States
  const [search, setSearch] = useState('')

  // ── Data Loading ───────────────────────────────────────────

  const loadData = async () => {
    if (!school?.id) return
    setLoading(true)
    try {
      const [tData, sData, aData] = await Promise.all([
        fetchTeachers(school.id),
        fetchAllTeacherSubjects(school.id),
        fetchAllocations(school.id)
      ])
      setTeachers(tData)
      setTeacherSubjects(sData)
      setAllocations(aData)
    } catch (err) {
      console.error('Failed to load teacher data:', err)
      toast.error('Could not load teacher records')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendance = async (date: string) => {
    if (!school?.id) return
    setLoadingAttendance(true)
    try {
      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('school_id', school.id)
        .eq('date', date)

      if (error) {
        // Table might not exist yet or other error
        console.warn('Attendance load error:', error.message)
        setAttendanceData({})
        return
      }

      const map: Record<string, AttendanceStatus> = {}
      data?.forEach((row: TeacherAttendance) => {
        map[row.teacher_id] = row.status
      })
      setAttendanceData(map)
    } catch (err) {
      console.error('Attendance fetch error:', err)
    } finally {
      setLoadingAttendance(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [school?.id])

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendance(attendanceDate)
    }
  }, [activeTab, attendanceDate, school?.id])

  // ── Helpers ────────────────────────────────────────────────

  const getTeacherStats = (teacherId: string) => {
    const subjects = teacherSubjects.filter(ts => ts.teacher_id === teacherId)
    const teacherAllocations = allocations.filter(a => a.teacher_id === teacherId)
    
    const assignedClasses = [...new Set(teacherAllocations.map(a => {
      const cls = classes.find(c => c.id === a.class_id)
      return cls ? `Gr ${cls.grade}${cls.stream}` : null
    }).filter(Boolean))] as string[]

    const taughtSubjects = [...new Set(subjects.map(s => s.subject_code.split('_').slice(0, 2).join(' ')))]

    return { assignedClasses, taughtSubjects }
  }

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tsc_no?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
    )
  }, [teachers, search])

  const handleStatusChange = (teacherId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({ ...prev, [teacherId]: status }))
  }

  const saveAllAttendance = async () => {
    if (!school?.id) return
    setSavingAttendance(true)
    try {
      const rows = Object.entries(attendanceData).map(([teacher_id, status]) => ({
        teacher_id,
        school_id: school.id,
        date: attendanceDate,
        status
      }))

      if (rows.length === 0) {
        toast.info('No attendance changes to save')
        return
      }

      // Upsert by teacher_id and date (composite key)
      const { error } = await supabase
        .from('teacher_attendance')
        .upsert(rows, { onConflict: 'teacher_id,date' })

      if (error) throw error
      toast.success('Attendance records updated')
    } catch (err: any) {
      console.error('Failed to save attendance:', err)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSavingAttendance(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[--color-text]">Teacher Management</h1>
          <p className="text-sm text-[--color-muted]">Directory and daily attendance tracking.</p>
        </div>
        
        <div className="flex bg-[--color-surface] p-1 rounded-xl border border-[--color-accent-light]">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'directory' 
                ? 'bg-white text-[--color-primary] shadow-sm' 
                : 'text-[--color-muted] hover:text-[--color-text]'
            }`}
          >
            Directory
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'attendance' 
                ? 'bg-white text-[--color-primary] shadow-sm' 
                : 'text-[--color-muted] hover:text-[--color-text]'
            }`}
          >
            Daily Register
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'directory' ? (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Search by name, TSC number or email..."
                  iconLeft="bi-search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  wrapperStyle={{ marginBottom: 0 }}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLoader key={i} className="h-48" />)}
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-[--color-accent-light] border-dashed">
                <i className="bi bi-person-badge text-4xl text-[--color-muted] mb-3 block" />
                <p className="text-[--color-muted]">No teachers found in the directory.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map(t => {
                  const { assignedClasses, taughtSubjects } = getTeacherStats(t.id)
                  return (
                    <Card key={t.id} className="hover:border-[--color-primary]/20 transition-all p-5 h-full flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[--color-surface] flex items-center justify-center text-[--color-primary] font-bold text-xl shrink-0">
                          {t.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[--color-text] truncate">{t.name}</h3>
                            {t.gender && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                t.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                              }`}>
                                {t.gender === 'Male' ? 'M' : 'F'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[--color-muted] font-medium uppercase tracking-wider">
                            TSC: {t.tsc_no || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-xs text-[--color-text]">
                          <i className="bi bi-telephone text-[--color-muted]" />
                          <span>{t.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[--color-text]">
                          <i className="bi bi-envelope text-[--color-muted]" />
                          <span className="truncate">{t.email || 'No email'}</span>
                        </div>
                        
                        <div className="pt-2">
                          <p className="text-[10px] font-bold text-[--color-muted] uppercase mb-1.5">Assigned Classes</p>
                          <div className="flex flex-wrap gap-1">
                            {assignedClasses.length > 0 ? assignedClasses.map(c => (
                              <Badge key={c} variant="neutral" className="text-[9px] px-1.5 py-0">
                                {c}
                              </Badge>
                            )) : <span className="text-[10px] italic text-[--color-muted]">None</span>}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-[--color-muted] uppercase mb-1.5">Subjects</p>
                          <div className="flex flex-wrap gap-1">
                            {taughtSubjects.length > 0 ? taughtSubjects.map(s => (
                              <Badge key={s} variant="success" className="text-[9px] px-1.5 py-0 bg-[#E8F5E9] text-[#2E7D32] border-none">
                                {s}
                              </Badge>
                            )) : <span className="text-[10px] italic text-[--color-muted]">None</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Register Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[--color-accent-light]">
              <div className="flex items-center gap-3">
                <i className="bi bi-calendar-check text-[--color-primary] text-lg" />
                <div>
                  <label className="text-[10px] font-bold text-[--color-muted] uppercase block">Attendance Date</label>
                  <input 
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="text-sm font-semibold outline-none focus:text-[--color-primary]"
                  />
                </div>
              </div>

              <Button 
                variant="primary" 
                icon="bi-cloud-upload-fill"
                loading={savingAttendance}
                onClick={saveAllAttendance}
                disabled={teachers.length === 0}
              >
                Save All Records
              </Button>
            </div>

            {/* Attendance List */}
            <div className="bg-white rounded-2xl border border-[--color-accent-light] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[--color-surface] border-b border-[--color-accent-light]">
                    <th className="px-6 py-4 text-left text-xs font-bold text-[--color-muted] uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[--color-muted] uppercase tracking-wider">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-accent-light]">
                  {loadingAttendance || isLoading ? (
                    [1, 2, 3, 4].map(i => (
                      <tr key={i}>
                        <td className="px-6 py-4"><SkeletonLoader className="h-8 w-48" /></td>
                        <td className="px-6 py-4 flex justify-center gap-2"><SkeletonLoader className="h-8 w-64" /></td>
                      </tr>
                    ))
                  ) : teachers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-[--color-muted] italic">
                        No teachers registered yet.
                      </td>
                    </tr>
                  ) : (
                    teachers.map(t => (
                      <tr key={t.id} className="hover:bg-[--color-surface]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[--color-surface] flex items-center justify-center text-[--color-primary] font-bold text-sm">
                              {t.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[--color-text]">{t.name}</p>
                              <p className="text-[10px] text-[--color-muted] uppercase tracking-wide">TSC: {t.tsc_no || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {(['present', 'absent', 'late'] as AttendanceStatus[]).map(status => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(t.id, status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  attendanceData[t.id] === status
                                    ? status === 'present' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' :
                                      status === 'absent' ? 'bg-[#FFEBEE] text-[#C62828] border-[#C62828]' :
                                      'bg-[#FFF3E0] text-[#EF6C00] border-[#EF6C00]'
                                    : 'bg-white text-[--color-muted] border-[--color-accent-light] hover:border-[--color-muted]'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
