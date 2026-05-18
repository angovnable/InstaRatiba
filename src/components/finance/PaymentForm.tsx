import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { fetchStudents } from '@/lib/supabase/students'
import { useSchoolStore } from '@/store/schoolStore'
import { Button, Input } from '@/components/ui'
import type { PaymentTransaction, Student } from '@/types/school'

const paymentSchema = z.object({
  student_id: z.string().min(1, 'Select a student'),
  amount_paid: z.number().min(1, 'Amount must be greater than 0'),
  balance: z.number().min(0),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']),
  academic_year: z.number().min(2020),
  reference_number: z.string().min(3, 'Reference number is required'),
})

type PaymentSchema = z.infer<typeof paymentSchema>

interface Props {
  onSuccess: () => void
  onSubmit: (data: Partial<PaymentTransaction>) => Promise<{ success: boolean, error?: string }>
}

export default function PaymentForm({ onSuccess, onSubmit }: Props) {
  const { school } = useSchoolStore()
  const [students, setStudents] = useState<Student[]>([])
  
  useEffect(() => {
    if (school?.id) fetchStudents(school.id).then(setStudents)
  }, [school?.id])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PaymentSchema>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      academic_year: school?.academic_year || new Date().getFullYear(),
      term: school?.current_term === 1 ? 'Term 1' : school?.current_term === 2 ? 'Term 2' : 'Term 3',
      amount_paid: 0,
      balance: 0,
    }
  })

  const handleFormSubmit = async (data: PaymentSchema) => {
    const status = data.balance === 0 ? 'Fully Paid' : 'Partial'
    const res = await onSubmit({ ...data, status })
    if (res.success) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="text-label mb-1.5 block">Student</label>
        <select
          {...register('student_id')}
          className="w-full h-[38px] px-3 bg-white border border-[--color-accent-light] rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none"
        >
          <option value="">Select student...</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.admission_number})</option>
          ))}
        </select>
        {errors.student_id && <p className="text-[10px] text-[--color-red] mt-1">{errors.student_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Amount Paid" type="number" {...register('amount_paid', { valueAsNumber: true })} error={errors.amount_paid?.message} />
        <Input label="Remaining Balance" type="number" {...register('balance', { valueAsNumber: true })} error={errors.balance?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <Input label="Reference Number" placeholder="e.g. MPESA-ABC123XYZ" {...register('reference_number')} error={errors.reference_number?.message} />

      <div className="flex justify-end gap-3 pt-4 border-t border-[--color-accent-light]">
        <Button variant="primary" type="submit" loading={isSubmitting} fullWidth>Record Payment</Button>
      </div>
    </form>
  )
}
