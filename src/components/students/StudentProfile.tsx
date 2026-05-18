import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStudentMarks } from '@/hooks/useStudentMarks'
import { deleteStudent } from '@/lib/supabase/students'
import { Button, Card, Badge, Modal, SubjectChip, SkeletonLoader } from '@/components/ui'
import type { Student, MarkRecord } from '@/types/school'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import MarkForm from './MarkForm'
import { toast } from 'sonner'

interface Props {
  student: Student
  streamName: string
  onUpdate: () => void
  onDelete: () => void
}

export default function StudentProfile({ student, streamName, onUpdate, onDelete }: Props) {
  const { marks, loading, saveMark, getPerformanceSummary, refreshMarks } = useStudentMarks(student.id)
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false)
  const [editingMark, setEditingMark] = useState<MarkRecord | null>(null)
  
  const summary = getPerformanceSummary()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this student? All records will be lost.')) return
    try {
      await deleteStudent(student.id)
      toast.success('Student deleted')
      onDelete()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete student')
    }
  }

  const handleEditMark = (mark: MarkRecord) => {
    setEditingMark(mark)
    setIsMarkModalOpen(true)
  }

  const handleAddMark = () => {
    setEditingMark(null)
    setIsMarkModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-2xl bg-[--color-surface] flex items-center justify-center text-3xl font-bold text-[--color-primary] border-2 border-[--color-accent-light]">
          {student.name[0]}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[--color-text]">{student.name}</h2>
            <Badge variant="neutral">{streamName}</Badge>
          </div>
          <p className="text-[--color-muted] text-sm">ADM: {student.admission_number} • {student.gender} • DOB: {student.dob}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {student.subjects.map(code => (
              <SubjectChip key={code} name={getSubjectByCode(code)?.name || code} />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleDelete} icon="bi-trash">Delete</Button>
          <Button variant="primary" icon="bi-pencil">Edit Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Performance Summary */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-label">Performance Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[--color-surface] rounded-xl">
                <p className="text-[10px] uppercase text-[--color-muted]">Total Points</p>
                <p className="text-xl font-bold text-[--color-primary]">{summary.totalPoints}</p>
              </div>
              <div className="p-3 bg-[--color-surface] rounded-xl">
                <p className="text-[10px] uppercase text-[--color-muted]">Mean Score</p>
                <p className="text-xl font-bold text-[--color-primary]">{summary.meanScore}%</p>
              </div>
              <div className="p-3 bg-[--color-primary] rounded-xl col-span-2 flex items-center justify-between">
                <p className="text-sm font-medium text-white/80">Overall Grade</p>
                <p className="text-2xl font-black text-white">{summary.overallGrade}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-label">Parental Contact</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase text-[--color-muted]">Guardian Name</p>
                <p className="text-sm font-semibold">{student.parent_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[--color-muted]">Phone Number</p>
                <p className="text-sm font-semibold">{student.parent_phone}</p>
              </div>
              {student.parent_email && (
                <div>
                  <p className="text-[10px] uppercase text-[--color-muted]">Email Address</p>
                  <p className="text-sm font-semibold">{student.parent_email}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Mark Sheet */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[--color-accent-light] flex items-center justify-between bg-[rgba(247,245,239,0.5)]">
              <h3 className="text-sm font-bold text-[--color-text]">Academic Records</h3>
              <Button size="sm" variant="primary" onClick={handleAddMark} icon="bi-plus-lg">Add Mark</Button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-10"><SkeletonLoader lines={5} /></div>
              ) : marks.length === 0 ? (
                <div className="p-20 text-center">
                  <p className="text-sm text-[--color-muted]">No academic records found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-[--color-surface] text-[--color-muted] font-ui uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Subject</th>
                      <th className="px-5 py-3 text-center">CAT</th>
                      <th className="px-5 py-3 text-center">EXAM</th>
                      <th className="px-5 py-3 text-center">TOTAL</th>
                      <th className="px-5 py-3 text-center">GRADE</th>
                      <th className="px-5 py-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-accent-light]">
                    {marks.map(m => (
                      <tr key={m.id} className="hover:bg-[--color-surface]/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-[--color-text]">
                          {getSubjectByCode(m.subject_id)?.name || m.subject_id}
                          <p className="text-[10px] text-[--color-muted] font-normal">{m.academic_year} • {m.term}</p>
                        </td>
                        <td className="px-5 py-4 text-center">{m.cat_marks}</td>
                        <td className="px-5 py-4 text-center">{m.exam_marks}</td>
                        <td className="px-5 py-4 text-center font-bold text-[--color-primary]">{m.total_marks}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.grade === 'A' ? 'bg-green-100 text-green-700' :
                            m.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            m.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {m.grade}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => handleEditMark(m)}
                            className="text-[--color-muted] hover:text-[--color-primary] transition-colors"
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        title={editingMark ? 'Edit Academic Record' : 'Record New Marks'}
        size="md"
      >
        <MarkForm
          studentId={student.id}
          studentSubjects={student.subjects}
          initialData={editingMark}
          onSuccess={() => {
            setIsMarkModalOpen(false)
            refreshMarks()
          }}
          onCancel={() => setIsMarkModalOpen(false)}
          saveMark={saveMark}
        />
      </Modal>
    </div>
  )
}
