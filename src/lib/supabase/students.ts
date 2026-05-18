// ============================================================
// InstaRatiba — src/lib/supabase/students.ts
// Data layer for student management
// ============================================================

import { supabase } from './client'
import type { Student } from '@/types/school'

/** Fetch all students for a school (via streams/classes join if needed) */
export async function fetchStudents(schoolId: string): Promise<Student[]> {
  // Assuming 'students' table has school_id or linked via stream_id -> classes -> school_id
  // For simplicity, let's assume 'students' table has a school_id column for now, 
  // or we filter by streams that belong to the school.
  
  // First, get streams for this school
  const { data: streams } = await supabase
    .from('classes')
    .select('id')
    .eq('school_id', schoolId)
    
  if (!streams || streams.length === 0) return []
  
  const streamIds = streams.map(s => s.id)
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .in('stream_id', streamIds)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as Student[]
}

/** Upsert a student record */
export async function upsertStudent(student: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .upsert({
      ...student,
      id: student.id || crypto.randomUUID(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Student
}

/** Delete a student */
export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
