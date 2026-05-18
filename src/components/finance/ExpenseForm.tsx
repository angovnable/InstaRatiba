import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input } from '@/components/ui'
import type { Expense } from '@/types/school'

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(3, 'Description is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
})

type ExpenseSchema = z.infer<typeof expenseSchema>

interface Props {
  onSuccess: () => void
  onSubmit: (data: Partial<Expense>) => Promise<{ success: boolean, error?: string }>
}

const CATEGORIES = ['Tuition', 'Transport', 'Food/Lunch', 'Maintenance', 'Salaries', 'Supplies', 'Other']

export default function ExpenseForm({ onSuccess, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
    }
  })

  const handleFormSubmit = async (data: ExpenseSchema) => {
    const res = await onSubmit(data)
    if (res.success) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="text-label mb-1.5 block">Category</label>
        <select
          {...register('category')}
          className="w-full h-[38px] px-3 bg-white border border-[--color-accent-light] rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none"
        >
          <option value="">Select category...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <p className="text-[10px] text-[--color-red] mt-1">{errors.category.message}</p>}
      </div>

      <Input label="Amount" type="number" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
      <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
      <Input label="Description" placeholder="e.g. Purchase of textbooks" {...register('description')} error={errors.description?.message} />

      <div className="flex justify-end gap-3 pt-4 border-t border-[--color-accent-light]">
        <Button variant="danger" type="submit" loading={isSubmitting} fullWidth>Record Expense</Button>
      </div>
    </form>
  )
}
