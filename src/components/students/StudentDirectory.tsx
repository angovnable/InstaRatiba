import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSchoolStore } from '@/store/schoolStore'
import { fetchStudents, deleteStudent } from '@/lib/supabase/students'
import { Button, Input, Card, Badge, Modal, SkeletonLoader } from '@/components/ui'
import type { Student } from '@/types/school'
import StudentForm from './StudentForm'
import StudentProfile from './StudentProfile'

export default function StudentDirectory() {
  const { classes, school } = useSchoolStore()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [streamFilter, setStreamFilter] = useState('all')
  
  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const loadData = async () => {
    if (!school?.id) return
    setLoading(true)
    try {
      const data = await fetchStudents(school.id)
      setStudents(data)
    } catch (err) {
      console.error('Failed to load students:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [school?.id])

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.admission_number.toLowerCase().includes(search.toLowerCase())
      const matchesStream = streamFilter === 'all' || s.stream_id === streamFilter
      return matchesSearch && matchesStream
    })
  }, [students, search, streamFilter])

  const getStreamName = (id: string) => {
    const cls = classes.find(c => c.id === id)
    return cls ? `Grade ${cls.grade}${cls.stream}` : 'Unknown'
  }

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setIsProfileOpen(true)
  }

  if (loading && students.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonLoader lines={1} height="2rem" className="w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLoader key={i} lines={3} height="6rem" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[--color-text]">Student Directory</h1>
          <p className="text-sm text-[--color-muted]">Manage your school's student body and performance.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsFormOpen(true)}
          icon="bi-person-plus-fill"
        >
          Add Student
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by name or admission number..."
            iconLeft="bi-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            wrapperStyle={{ marginBottom: 0 }}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={streamFilter}
            onChange={e => setStreamFilter(e.target.value)}
            className="w-full h-[38px] px-3 bg-white border border-[--color-accent-light] rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none"
          >
            <option value="all">All Streams</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>Grade {cls.grade}{cls.stream}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[--color-accent-light] border-dashed">
          <i className="bi bi-people text-4xl text-[--color-muted] mb-3 block" />
          <p className="text-[--color-muted]">No students found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(s => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              onClick={() => handleStudentClick(s)}
              className="cursor-pointer"
            >
              <Card className="hover:border-[--color-gold]/30 transition-all p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[--color-surface] flex items-center justify-center text-[--color-primary] font-bold text-lg">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[--color-text] truncate">{s.name}</h3>
                    <p className="text-xs text-[--color-muted]">{s.admission_number}</p>
                  </div>
                  <Badge variant="neutral" className="text-[10px]">
                    {getStreamName(s.stream_id)}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title="Add New Student"
        size="lg"
      >
        <StudentForm 
          onSuccess={() => {
            setIsFormOpen(false)
            loadData()
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Student Profile Slide-over / Modal */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Student Profile"
        size="full"
      >
        {selectedStudent && (
          <StudentProfile 
            student={selectedStudent} 
            streamName={getStreamName(selectedStudent.stream_id)}
            onUpdate={() => loadData()}
            onDelete={() => {
              setIsProfileOpen(false)
              loadData()
            }}
          />
        )}
      </Modal>
    </div>
  )
}
