import React from 'react'
import { useSchoolStore } from '@/store/schoolStore'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import type { Student, MarkRecord, TermType } from '@/types/school'
import { Button } from '@/components/ui'

interface AttendanceSummary {
  days_present: number
  total_days: number
}

interface Props {
  student: Student
  marks: MarkRecord[]
  term: TermType
  year: number
  attendance: AttendanceSummary
}

export default function ReportCardView({ student, marks, term, year, attendance }: Props) {
  const { school, classes } = useSchoolStore()
  
  const studentClass = classes.find(c => c.id === student.stream_id)
  const streamName = studentClass ? `Grade ${studentClass.grade}${studentClass.stream}` : 'N/A'

  const handlePrint = () => {
    window.print()
  }

  // Calculate totals for summary
  const totalMarks = marks.reduce((acc, m) => acc + m.total_marks, 0)
  const meanScoreValue = marks.length > 0 ? totalMarks / marks.length : 0
  const meanScore = meanScoreValue.toFixed(1)

  const getOverallGrade = (score: number) => {
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'E'
  }

  const overallGrade = getOverallGrade(meanScoreValue)

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-8 bg-white min-h-screen sm:shadow-lg rounded-xl print:shadow-none print:p-0 print:m-0 print:max-w-none">
      
      {/* ── Action Header (Hidden in Print) ── */}
      <div className="no-print flex justify-between items-center mb-8 border-b border-[--color-accent-light] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[--color-text]">Report Card Preview</h2>
          <p className="text-sm text-[--color-muted]">Official academic performance record.</p>
        </div>
        <Button variant="primary" icon="bi-printer" onClick={handlePrint}>
          Print / Save PDF
        </Button>
      </div>

      {/* ── Report Card Body ── */}
      <div id="report-card-capture" className="space-y-8 text-black font-serif">
        
        {/* School Header */}
        <div className="text-center space-y-2 border-b-2 border-black pb-6">
          {school?.logo_url && (
            <img src={school.logo_url} alt="Logo" className="w-20 h-20 mx-auto object-contain mb-2" />
          )}
          <h1 className="text-3xl font-black uppercase tracking-tight leading-none">
            {school?.name || 'Class Link Academy'}
          </h1>
          <p className="text-sm font-bold uppercase">
            P.O. Box {school?.county || 'Nairobi'} • Email: {school?.nemis_code || 'info@school.ac.ke'}
          </p>
          <div className="mt-4 inline-block px-6 py-1 bg-black text-white font-bold rounded-full text-sm">
            OFFICIAL ACADEMIC REPORT — {term.toUpperCase()}, {year}
          </div>
        </div>

        {/* Student Biodata */}
        <div className="grid grid-cols-2 gap-y-4 text-sm border-2 border-black p-6 rounded-lg bg-gray-50/50">
          <div className="flex gap-2">
            <span className="font-bold w-32">STUDENT NAME:</span>
            <span className="uppercase border-b border-dotted border-black flex-1">{student.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-32">ADM NUMBER:</span>
            <span className="uppercase border-b border-dotted border-black flex-1">{student.admission_number}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-32">GRADE / STREAM:</span>
            <span className="uppercase border-b border-dotted border-black flex-1">{streamName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-32">GENDER:</span>
            <span className="uppercase border-b border-dotted border-black flex-1">{student.gender}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-32">ATTENDANCE:</span>
            <span className="uppercase border-b border-dotted border-black flex-1">
              {attendance.days_present} / {attendance.total_days} DAYS
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-32">REPORT DATE:</span>
            <span className="uppercase border-b border-dotted border-black flex-1">
              {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Performance Grid */}
        <div className="overflow-hidden border-2 border-black rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr>
                <th className="px-4 py-3 text-left border-r border-black uppercase font-black">Subject</th>
                <th className="px-2 py-3 text-center border-r border-black uppercase font-black w-16">CAT</th>
                <th className="px-2 py-3 text-center border-r border-black uppercase font-black w-16">Exam</th>
                <th className="px-2 py-3 text-center border-r border-black uppercase font-black w-16">Total</th>
                <th className="px-2 py-3 text-center border-r border-black uppercase font-black w-16">Grade</th>
                <th className="px-4 py-3 text-left uppercase font-black">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m, i) => (
                <tr key={i} className="border-b border-black last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border-r border-black font-bold uppercase">
                    {getSubjectByCode(m.subject_id)?.name || m.subject_id}
                  </td>
                  <td className="px-2 py-3 text-center border-r border-black">{m.cat_marks}</td>
                  <td className="px-2 py-3 text-center border-r border-black">{m.exam_marks}</td>
                  <td className="px-2 py-3 text-center border-r border-black font-bold">{m.total_marks}</td>
                  <td className="px-2 py-3 text-center border-r border-black font-black">{m.grade}</td>
                  <td className="px-4 py-3 text-xs italic">{m.remarks || 'Consistent effort noted.'}</td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="bg-gray-100 border-t-2 border-black font-black">
                <td className="px-4 py-3 border-r border-black uppercase">Grand Totals / Mean</td>
                <td colSpan={2} className="px-2 py-3 text-center border-r border-black">—</td>
                <td className="px-2 py-3 text-center border-r border-black text-lg">{totalMarks}</td>
                <td className="px-2 py-3 text-center border-r border-black text-lg">{meanScore}%</td>
                <td className="px-4 py-3 text-right">GRADE: {overallGrade}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sign-off Blocks */}
        <div className="grid grid-cols-2 gap-8 pt-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase underline decoration-2 underline-offset-4">Class Teacher's Remarks:</h3>
              <div className="min-h-[60px] border-b-2 border-dotted border-black italic text-sm">
                A disciplined and focused student who shows great potential in science-based subjects.
              </div>
              <div className="pt-4 flex justify-between items-end">
                <div className="flex-1 border-b border-black"></div>
                <span className="text-[10px] uppercase font-bold ml-2">Signature</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase underline decoration-2 underline-offset-4">Principal's Remarks:</h3>
              <div className="min-h-[60px] border-b-2 border-dotted border-black italic text-sm">
                Recommended for promotion to the next level. Keep up the good work.
              </div>
              <div className="pt-4 flex justify-between items-end">
                <div className="flex-1 border-b border-black h-8 flex items-center justify-center">
                  <span className="text-[10px] text-gray-400">School Stamp / Seal</span>
                </div>
                <span className="text-[10px] uppercase font-bold ml-2">Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Disclaimer */}
        <div className="text-center pt-12 text-[10px] uppercase text-gray-500 font-bold tracking-widest border-t border-gray-200">
          This is a computer-generated report card • {school?.name || 'Class Link Academy'} • © {year}
        </div>

      </div>
    </div>
  )
}
