import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSchoolStore } from '@/store/schoolStore'
import { Button, Input } from '@/components/ui'
import type { FeeStructure } from '@/types/school'

const feeSchema = z.object({
  grade_level: z.string().min(1, 'Grade level is required'),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']),
  academic_year: z.number().min(2020),
  tuition: z.number().min(0),
  transport: z.number().min(0),
  lunch: z.number().min(0),
  exams: z.number().min(0),
})

type FeeSchema = z.infer<typeof feeSchema>

interface Props {
  onSuccess: () => void
  onSubmit: (data: Partial<FeeStructure>) => Promise<{ success: boolean, error?: string }>
}

export default function FeeStructureForm({ onSuccess, onSubmit }: Props) {
  const { school } = useSchoolStore()
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FeeSchema>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      academic_year: school?.academic_year || new Date().getFullYear(),
      term: school?.current_term === 1 ? 'Term 1' : school?.current_term === 2 ? 'Term 2' : 'Term 3',
      tuition: 0,
      transport: 0,
      lunch: 0,
      exams: 0,
    }
  })

  const values = watch()
  const total = (values.tuition || 0) + (values.transport || 0) + (values.lunch || 0) + (values.exams || 0)

  const handleFormSubmit = async (data: FeeSchema) => {
    const res = await onSubmit({ ...data, total_required: total })
    if (res.success) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Grade Level" placeholder="e.g. Grade 1" {...register('grade_level')} error={errors.grade_level?.message} />
        <div>
          <label className="text-label mb-1.5 block">Term</label>
          <select
            {...register('term')}
            className="w-full h-[38px] px-3 bg-white border border-[--color-accent-light] rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none"
          >
            {['Term 1', 'Term 2', 'Term 3'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Input label="Academic Year" type="number" {...register('academic_year', { valueAsNumber: true })} error={errors.academic_year?.message} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <Input label="Tuition" type="number" {...register('tuition', { valueAsNumber: true })} />
        <Input label="Transport" type="number" {...register('transport', { valueAsNumber: true })} />
        <Input label="Lunch" type="number" {...register('lunch', { valueAsNumber: true })} />
        <Input label="Exams" type="number" {...register('exams', { valueAsNumber: true })} />
      </div>

      <div className="p-4 bg-[--color-surface] rounded-xl flex justify-between items-center">
        <span className="font-bold text-[--color-text]">Total Fee Required</span>
        <span className="text-xl font-black text-[--color-primary]">KES {total.toLocaleString()}</span>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[--color-accent-light]">
        <Button variant="gold" type="submit" loading={isSubmitting} fullWidth>Save Fee Structure</Button>
      </div>
    </form>
  )
}
