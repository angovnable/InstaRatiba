import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSchoolStore } from '@/store/schoolStore'
import { upsertStudent } from '@/lib/supabase/students'
import { Button, Input } from '@/components/ui'
import { CBC_SUBJECTS_BY_LEVEL } from '@/lib/cbc/subjects'
import type { Student, GenderType } from '@/types/school'
import { toast } from 'sonner'

const studentSchema = z.object({
  name: z.string().min(3, 'Full name is required'),
  admission_number: z.string().min(1, 'Admission number is required'),
  gender: z.enum(['Male', 'Female']),
  dob: z.string().min(1, 'Date of birth is required'),
  stream_id: z.string().min(1, 'Stream is required'),
  parent_name: z.string().min(3, 'Parent name is required'),
  parent_phone: z.string().min(10, 'Valid phone number is required'),
  parent_email: z.string().email().optional().or(z.literal('')),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
})

type StudentSchema = z.infer<typeof studentSchema>

interface Props {
  initialData?: Student
  onSuccess: () => void
  onCancel: () => void
}

export default function StudentForm({ initialData, onSuccess, onCancel }: Props) {
  const { classes } = useSchoolStore()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      admission_number: initialData.admission_number,
      gender: initialData.gender,
      dob: initialData.dob,
      stream_id: initialData.stream_id,
      parent_name: initialData.parent_name,
      parent_phone: initialData.parent_phone,
      parent_email: initialData.parent_email || '',
      subjects: initialData.subjects || [],
    } : {
      gender: 'Male',
      subjects: [],
    },
  })

  const selectedStreamId = watch('stream_id')
  const selectedSubjects = watch('subjects')

  const availableSubjects = useMemo(() => {
    const cls = classes.find(c => c.id === selectedStreamId)
    if (!cls) return []
    
    let level: 'lower_primary' | 'upper_primary' | 'junior_secondary' = 'lower_primary'
    if (cls.grade >= 1 && cls.grade <= 3) level = 'lower_primary'
    else if (cls.grade >= 4 && cls.grade <= 6) level = 'upper_primary'
    else if (cls.grade >= 7 && cls.grade <= 9) level = 'junior_secondary'
    
    return CBC_SUBJECTS_BY_LEVEL[level]
  }, [selectedStreamId, classes])

  // Auto-select all subjects for the level if none selected when stream changes
  useEffect(() => {
    if (availableSubjects.length > 0 && selectedSubjects.length === 0) {
      setValue('subjects', availableSubjects.map(s => s.code))
    }
  }, [availableSubjects, setValue, selectedSubjects.length])

  const onSubmit = async (data: StudentSchema) => {
    try {
      await upsertStudent({
        ...initialData,
        ...data,
      } as Student)
      toast.success(initialData ? 'Student updated' : 'Student added successfully')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save student')
    }
  }

  const toggleSubject = (code: string) => {
    const current = [...selectedSubjects]
    if (current.includes(code)) {
      setValue('subjects', current.filter(c => c !== code))
    } else {
      setValue('subjects', [...current, code])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <Input
          label="Full Name"
          placeholder="e.g. John Doe"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Admission Number"
          placeholder="e.g. 2024/001"
          {...register('admission_number')}
          error={errors.admission_number?.message}
        />
        
        <div className="mb-[14px]">
          <label className="text-label mb-1.5 block">Gender</label>
          <div className="flex gap-4">
            {['Male', 'Female'].map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value={g}
                  {...register('gender')}
                  className="w-4 h-4 accent-[--color-primary]"
                />
                <span className="text-sm font-body text-[--color-text] group-hover:text-[--color-primary] transition-colors">
                  {g}
                </span>
              </label>
            ))}
          </div>
          {errors.gender && <p className="text-[10px] text-[--color-red] mt-1">{errors.gender.message}</p>}
        </div>

        <Input
          label="Date of Birth"
          type="date"
          {...register('dob')}
          error={errors.dob?.message}
        />

        <div className="mb-[14px]">
          <label className="text-label mb-1.5 block">Stream / Class</label>
          <select
            {...register('stream_id')}
            className={`w-full h-[38px] px-3 bg-white border ${errors.stream_id ? 'border-[--color-red]' : 'border-[--color-accent-light]'} rounded-lg text-sm font-ui focus:border-[--color-primary] outline-none transition-all`}
          >
            <option value="">Select stream...</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>Grade {cls.grade}{cls.stream}</option>
            ))}
          </select>
          {errors.stream_id && <p className="text-[10px] text-[--color-red] mt-1">{errors.stream_id.message}</p>}
        </div>
      </div>

      <div className="border-t border-[--color-accent-light] pt-4 mt-2">
        <h3 className="text-sm font-bold text-[--color-text] mb-4">Parent / Guardian Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <Input
            label="Parent Name"
            placeholder="e.g. Jane Doe"
            {...register('parent_name')}
            error={errors.parent_name?.message}
          />
          <Input
            label="Phone Number"
            placeholder="0712 345 678"
            {...register('parent_phone')}
            error={errors.parent_phone?.message}
          />
          <Input
            label="Email Address (Optional)"
            placeholder="jane@example.com"
            {...register('parent_email')}
            error={errors.parent_email?.message}
          />
        </div>
      </div>

      <div className="border-t border-[--color-accent-light] pt-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[--color-text]">Subjects</h3>
          <p className="text-[10px] text-[--color-muted]">{selectedSubjects.length} selected</p>
        </div>
        
        {availableSubjects.length === 0 ? (
          <p className="text-xs text-[--color-muted] italic">Please select a stream to see available subjects.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableSubjects.map(s => {
              const active = selectedSubjects.includes(s.code)
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => toggleSubject(s.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active 
                      ? 'bg-[--color-primary] text-white border-[--color-primary]' 
                      : 'bg-white text-[--color-text] border-[--color-accent-light] hover:border-[--color-primary]'
                  }`}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
        )}
        {errors.subjects && <p className="text-[10px] text-[--color-red] mt-2">{errors.subjects.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[--color-accent-light]">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {initialData ? 'Update Student' : 'Register Student'}
        </Button>
      </div>
    </form>
  )
}
