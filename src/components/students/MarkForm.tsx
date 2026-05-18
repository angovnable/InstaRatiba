import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSchoolStore } from '@/store/schoolStore'
import { Button, Input } from '@/components/ui'
import type { MarkRecord, TermType } from '@/types/school'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import { toast } from 'sonner'

const markSchema = z.object({
  subject_id: z.string().min(1, 'Subject is required'),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']),
  academic_year: z.number().min(2000),
  cat_marks: z.number().min(0).max(40, 'CAT marks cannot exceed 40'),
  exam_marks: z.number().min(0).max(70, 'Exam marks cannot exceed 70'),
})

type MarkSchema = z.infer<typeof markSchema>

interface Props {
  studentId: string
  studentSubjects: string[]
  initialData?: MarkRecord | null
  onSuccess: () => void
  onCancel: () => void
  saveMark: (record: Partial<MarkRecord>) => Promise<{ data: any, error: any }>
}

export default function MarkForm({ 
  studentId: _studentId, 
  studentSubjects, 
  initialData, 
  onSuccess, 
  onCancel,
  saveMark
}: Props) {
  const { school } = useSchoolStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarkSchema>({
    resolver: zodResolver(markSchema),
    defaultValues: initialData ? {
      subject_id: initialData.subject_id,
      term: initialData.term,
      academic_year: initialData.academic_year,
      cat_marks: initialData.cat_marks,
      exam_marks: initialData.exam_marks,
    } : {
      term: school?.current_term === 1 ? 'Term 1' : school?.current_term === 2 ? 'Term 2' : 'Term 3',
      academic_year: school?.academic_year || new Date().getFullYear(),
      cat_marks: 0,
      exam_marks: 0,
    },
  })

  const onSubmit = async (data: MarkSchema) => {
    try {
      const res = await saveMark({
        ...initialData,
        ...data,
      } as MarkRecord)
      
      if (res.error) throw new Error(res.error)
      
      toast.success(initialData ? 'Marks updated' : 'Marks recorded')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save marks')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="mb-[14px]">
        <label className="text-label mb-1.5 block">Subject</label>
        <select
          {...register('subject_id')}
          className={`w-full h-[38px] px-3 bg-white border ${errors.subject_id ? 'border-[--color-red]' : 'border-[--color-accent-light]'} rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none transition-all`}
        >
          <option value="">Select subject...</option>
          {studentSubjects.map(code => (
            <option key={code} value={code}>
              {getSubjectByCode(code)?.name || code}
            </option>
          ))}
        </select>
        {errors.subject_id && <p className="text-[10px] text-[--color-red] mt-1">{errors.subject_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="mb-[14px]">
          <label className="text-label mb-1.5 block">Term</label>
          <select
            {...register('term')}
            className="w-full h-[38px] px-3 bg-white border border-[--color-accent-light] rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none"
          >
            {['Term 1', 'Term 2', 'Term 3'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <Input
          label="Academic Year"
          type="number"
          {...register('academic_year', { valueAsNumber: true })}
          error={errors.academic_year?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="CAT Marks (Max 40)"
          type="number"
          step="0.5"
          {...register('cat_marks', { valueAsNumber: true })}
          error={errors.cat_marks?.message}
          helper="Continuous Assessment"
        />
        <Input
          label="Exam Marks (Max 70)"
          type="number"
          step="0.5"
          {...register('exam_marks', { valueAsNumber: true })}
          error={errors.exam_marks?.message}
          helper="End of Term"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[--color-accent-light]">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {initialData ? 'Update Record' : 'Save Record'}
        </Button>
      </div>
    </form>
  )
}
