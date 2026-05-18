import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { MarkRecord } from '@/types/school'

/**
 * useStudentMarks Hook
 * Manages academic marks for a specific student.
 */
export function useStudentMarks(studentId: string) {
  const [marks, setMarks]     = useState<MarkRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // ── Helper: Calculate Grade & Remarks ───────────────────────
  const calculateGradeInfo = (total: number) => {
    if (total >= 80) return { grade: 'A', remarks: 'Excellent' }
    if (total >= 70) return { grade: 'B', remarks: 'Very Good' }
    if (total >= 60) return { grade: 'C', remarks: 'Good' }
    if (total >= 50) return { grade: 'D', remarks: 'Fair' }
    return { grade: 'E', remarks: 'Needs Improvement' }
  }

  // ── Fetch Marks ──────────────────────────────────────────────
  const refreshMarks = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', studentId)

      if (error) throw error
      setMarks(data || [])
    } catch (err) {
      console.error('[useStudentMarks] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    refreshMarks()
  }, [refreshMarks])

  // ── Save Mark (Insert or Update) ─────────────────────────────
  const saveMark = async (record: Partial<MarkRecord>) => {
    const total = (record.cat_marks || 0) + (record.exam_marks || 0)
    const { grade, remarks } = calculateGradeInfo(total)

    const payload = {
      ...record,
      student_id:  studentId,
      total_marks: total,
      grade,
      remarks,
    }

    try {
      let result
      if (record.id) {
        // Update
        result = await supabase
          .from('marks')
          .update(payload)
          .eq('id', record.id)
          .select()
          .single()
      } else {
        // Insert
        result = await supabase
          .from('marks')
          .insert({ ...payload, id: crypto.randomUUID() })
          .select()
          .single()
      }

      if (result.error) throw result.error
      
      // Update local state
      setMarks(prev => {
        const index = prev.findIndex(m => m.id === result.data.id)
        if (index > -1) {
          const next = [...prev]
          next[index] = result.data
          return next
        }
        return [result.data, ...prev]
      })

      return { data: result.data, error: null }
    } catch (err: any) {
      console.error('[useStudentMarks] Save error:', err)
      return { data: null, error: err.message }
    }
  }

  // ── Performance Summary ──────────────────────────────────────
  const getPerformanceSummary = () => {
    if (marks.length === 0) {
      return { totalPoints: 0, meanScore: 0, overallGrade: 'N/A' }
    }

    const totalPoints = marks.reduce((sum, m) => sum + m.total_marks, 0)
    const meanScore   = totalPoints / marks.length
    const { grade: overallGrade } = calculateGradeInfo(meanScore)

    return {
      totalPoints,
      meanScore: parseFloat(meanScore.toFixed(2)),
      overallGrade,
    }
  }

  return {
    marks,
    loading,
    saveMark,
    getPerformanceSummary,
    refreshMarks,
  }
}
