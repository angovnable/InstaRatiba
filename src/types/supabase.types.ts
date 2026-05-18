export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      approval_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          slot_id: string | null
          timetable_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          slot_id?: string | null
          timetable_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          slot_id?: string | null
          timetable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_comments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "timetable_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_comments_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_teacher_id: string | null
          grade: number
          id: string
          school_id: string
          size: number | null
          stream: string
        }
        Insert: {
          class_teacher_id?: string | null
          grade: number
          id?: string
          school_id: string
          size?: number | null
          stream: string
        }
        Update: {
          class_teacher_id?: string | null
          grade?: number
          id?: string
          school_id?: string
          size?: number | null
          stream?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      conflicts: {
        Row: {
          description: string
          id: string
          resolved: boolean
          severity: string
          timetable_id: string
          type: string
        }
        Insert: {
          description: string
          id?: string
          resolved?: boolean
          severity: string
          timetable_id: string
          type: string
        }
        Update: {
          description?: string
          id?: string
          resolved?: boolean
          severity?: string
          timetable_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflicts_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_roster: {
        Row: {
          day: string
          duty_type: string
          id: string
          teacher_id: string
          timetable_id: string
        }
        Insert: {
          day: string
          duty_type: string
          id?: string
          teacher_id: string
          timetable_id: string
        }
        Update: {
          day?: string
          duty_type?: string
          id?: string
          teacher_id?: string
          timetable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_roster_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_roster_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component: string
          created_at: string
          id: string
          school_id: string | null
          stack_trace: string
        }
        Insert: {
          component: string
          created_at?: string
          id?: string
          school_id?: string | null
          stack_trace: string
        }
        Update: {
          component?: string
          created_at?: string
          id?: string
          school_id?: string | null
          stack_trace?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          academic_year: string
          exams: number | null
          grade_level: string
          id: string
          lunch: number | null
          term: Database["public"]["Enums"]["term_type"]
          total_required: number | null
          transport: number | null
          tuition: number | null
        }
        Insert: {
          academic_year: string
          exams?: number | null
          grade_level: string
          id?: string
          lunch?: number | null
          term: Database["public"]["Enums"]["term_type"]
          total_required?: number | null
          transport?: number | null
          tuition?: number | null
        }
        Update: {
          academic_year?: string
          exams?: number | null
          grade_level?: string
          id?: string
          lunch?: number | null
          term?: Database["public"]["Enums"]["term_type"]
          total_required?: number | null
          transport?: number | null
          tuition?: number | null
        }
        Relationships: []
      }
      level_timings: {
        Row: {
          break1_after_lesson: number
          break1_duration_min: number
          break2_after_lesson: number
          break2_duration_min: number
          id: string
          lesson_duration_min: number
          lesson_start: string
          level: string
          lunch_after_lesson: number | null
          lunch_duration_min: number | null
          lunch_enabled: boolean
          non_formal_end: string | null
          non_formal_start: string | null
          school_id: string
        }
        Insert: {
          break1_after_lesson?: number
          break1_duration_min?: number
          break2_after_lesson?: number
          break2_duration_min?: number
          id?: string
          lesson_duration_min?: number
          lesson_start?: string
          level: string
          lunch_after_lesson?: number | null
          lunch_duration_min?: number | null
          lunch_enabled?: boolean
          non_formal_end?: string | null
          non_formal_start?: string | null
          school_id: string
        }
        Update: {
          break1_after_lesson?: number
          break1_duration_min?: number
          break2_after_lesson?: number
          break2_duration_min?: number
          id?: string
          lesson_duration_min?: number
          lesson_start?: string
          level?: string
          lunch_after_lesson?: number | null
          lunch_duration_min?: number | null
          lunch_enabled?: boolean
          non_formal_end?: string | null
          non_formal_start?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_timings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          academic_year: string
          cat_marks: number | null
          created_at: string | null
          exam_marks: number | null
          grade: string | null
          id: string
          remarks: string | null
          stream_id: string | null
          student_id: string | null
          subject_id: string
          term: Database["public"]["Enums"]["term_type"]
          total_marks: number | null
        }
        Insert: {
          academic_year: string
          cat_marks?: number | null
          created_at?: string | null
          exam_marks?: number | null
          grade?: string | null
          id?: string
          remarks?: string | null
          stream_id?: string | null
          student_id?: string | null
          subject_id: string
          term: Database["public"]["Enums"]["term_type"]
          total_marks?: number | null
        }
        Update: {
          academic_year?: string
          cat_marks?: number | null
          created_at?: string | null
          exam_marks?: number | null
          grade?: string | null
          id?: string
          remarks?: string | null
          stream_id?: string | null
          student_id?: string | null
          subject_id?: string
          term?: Database["public"]["Enums"]["term_type"]
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marks_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          academic_year: string
          amount_paid: number
          balance: number
          date: string
          id: string
          reference_number: string
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string | null
          term: Database["public"]["Enums"]["term_type"]
        }
        Insert: {
          academic_year: string
          amount_paid: number
          balance: number
          date?: string
          id?: string
          reference_number: string
          status: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          term: Database["public"]["Enums"]["term_type"]
        }
        Update: {
          academic_year?: string
          amount_paid?: number
          balance?: number
          date?: string
          id?: string
          reference_number?: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          term?: Database["public"]["Enums"]["term_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          id: string
          levels: string[]
          name: string
          school_id: string
          subject_codes: string[]
        }
        Insert: {
          capacity?: number | null
          id?: string
          levels?: string[]
          name: string
          school_id: string
          subject_codes?: string[]
        }
        Update: {
          capacity?: number | null
          id?: string
          levels?: string[]
          name?: string
          school_id?: string
          subject_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_year: number
          climate_adjustment: boolean
          county: string
          created_at: string
          current_term: number
          id: string
          indigenous_language: string | null
          levels: string[]
          logo_url: string | null
          meta: Json | null
          motto: string | null
          name: string
          nemis_code: string | null
          sub_county: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year?: number
          climate_adjustment?: boolean
          county: string
          created_at?: string
          current_term?: number
          id?: string
          indigenous_language?: string | null
          levels?: string[]
          logo_url?: string | null
          meta?: Json | null
          motto?: string | null
          name: string
          nemis_code?: string | null
          sub_county?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year?: number
          climate_adjustment?: boolean
          county?: string
          created_at?: string
          current_term?: number
          id?: string
          indigenous_language?: string | null
          levels?: string[]
          logo_url?: string | null
          meta?: Json | null
          motto?: string | null
          name?: string
          nemis_code?: string | null
          sub_county?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streams: {
        Row: {
          capacity: number | null
          created_at: string | null
          grade_level: string
          id: string
          name: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          grade_level: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          grade_level?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_attendance: {
        Row: {
          date: string
          marked_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          date?: string
          marked_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          date?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_number: string
          created_at: string | null
          dob: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          name: string
          parent_email: string | null
          parent_name: string
          parent_phone: string
          photo_url: string | null
          stream_id: string | null
          subjects: string[] | null
        }
        Insert: {
          admission_number: string
          created_at?: string | null
          dob: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          name: string
          parent_email?: string | null
          parent_name: string
          parent_phone: string
          photo_url?: string | null
          stream_id?: string | null
          subjects?: string[] | null
        }
        Update: {
          admission_number?: string
          created_at?: string | null
          dob?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          name?: string
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string
          photo_url?: string | null
          stream_id?: string | null
          subjects?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "students_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_allocations: {
        Row: {
          class_id: string
          id: string
          lessons_per_week: number
          requires_double: boolean
          school_id: string
          subject_code: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          id?: string
          lessons_per_week: number
          requires_double?: boolean
          school_id: string
          subject_code: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          id?: string
          lessons_per_week?: number
          requires_double?: boolean
          school_id?: string
          subject_code?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_allocations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_allocations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_allocations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_attendance: {
        Row: {
          date: string
          status: Database["public"]["Enums"]["attendance_status"]
          teacher_id: string
        }
        Insert: {
          date?: string
          status: Database["public"]["Enums"]["attendance_status"]
          teacher_id: string
        }
        Update: {
          date?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          grades: number[]
          id: string
          subject_code: string
          teacher_id: string
        }
        Insert: {
          grades?: number[]
          id?: string
          subject_code: string
          teacher_id: string
        }
        Update: {
          grades?: number[]
          id?: string
          subject_code?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          classes: string[] | null
          created_at: string
          email: string | null
          id: string
          max_consecutive: number
          max_lessons_day: number
          max_lessons_week: number | null
          min_free_periods_day: number | null
          name: string
          phone: string | null
          photo_url: string | null
          school_id: string
          subjects: string[] | null
          tsc_no: string | null
          tsc_number: string | null
        }
        Insert: {
          classes?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          max_consecutive?: number
          max_lessons_day?: number
          max_lessons_week?: number | null
          min_free_periods_day?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
          school_id: string
          subjects?: string[] | null
          tsc_no?: string | null
          tsc_number?: string | null
        }
        Update: {
          classes?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          max_consecutive?: number
          max_lessons_day?: number
          max_lessons_week?: number | null
          min_free_periods_day?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          school_id?: string
          subjects?: string[] | null
          tsc_no?: string | null
          tsc_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_overrides: {
        Row: {
          date: string
          id: string
          override_teacher_id: string | null
          reason: string
          timetable_slot_id: string
        }
        Insert: {
          date: string
          id?: string
          override_teacher_id?: string | null
          reason: string
          timetable_slot_id: string
        }
        Update: {
          date?: string
          id?: string
          override_teacher_id?: string | null
          reason?: string
          timetable_slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_overrides_override_teacher_id_fkey"
            columns: ["override_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_overrides_timetable_slot_id_fkey"
            columns: ["timetable_slot_id"]
            isOneToOne: false
            referencedRelation: "timetable_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_share_tokens: {
        Row: {
          created_at: string
          id: string
          revoked_at: string | null
          timetable_id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          revoked_at?: string | null
          timetable_id: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          revoked_at?: string | null
          timetable_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_share_tokens_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          class_id: string
          day: string
          id: string
          is_assembly: boolean
          is_break: boolean
          is_non_formal: boolean
          is_ppi: boolean
          room_id: string | null
          slot_index: number
          subject_code: string | null
          teacher_id: string | null
          timetable_id: string
        }
        Insert: {
          class_id: string
          day: string
          id?: string
          is_assembly?: boolean
          is_break?: boolean
          is_non_formal?: boolean
          is_ppi?: boolean
          room_id?: string | null
          slot_index: number
          subject_code?: string | null
          teacher_id?: string | null
          timetable_id: string
        }
        Update: {
          class_id?: string
          day?: string
          id?: string
          is_assembly?: boolean
          is_break?: boolean
          is_non_formal?: boolean
          is_ppi?: boolean
          room_id?: string | null
          slot_index?: number
          subject_code?: string | null
          teacher_id?: string | null
          timetable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          name: string
          school_id: string
          status: string
          term_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
          status?: string
          term_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          status?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_allocation_summary: {
        Row: {
          class_id: string | null
          double_count: number | null
          school_id: string | null
          subject_count: number | null
          total_lessons: number | null
          unassigned_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_allocations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_allocations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_teacher_load: {
        Row: {
          allocated_lessons_week: number | null
          class_count: number | null
          max_lessons_week: number | null
          school_id: string | null
          teacher_id: string | null
          teacher_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_allocations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      gender_type: "Male" | "Female"
      payment_status: "Fully Paid" | "Partial" | "Overdue"
      term_type: "Term 1" | "Term 2" | "Term 3"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late"],
      gender_type: ["Male", "Female"],
      payment_status: ["Fully Paid", "Partial", "Overdue"],
      term_type: ["Term 1", "Term 2", "Term 3"],
    },
  },
} as const
