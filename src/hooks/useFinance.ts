import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { PaymentTransaction, Expense, Student, FeeStructure } from '@/types/school'

/**
 * Extended Payment type including joined student data
 */
export interface PaymentWithStudent extends PaymentTransaction {
  students: Pick<Student, 'name' | 'admission_number'> | null
}

/**
 * useFinance Hook
 * Manages school payments, expenses, and dashboard metrics.
 */
export function useFinance() {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading]   = useState<boolean>(true)
  const [error, setError]       = useState<string | null>(null)

  // ── Fetch All Finance Data ──────────────────────────────────
  const fetchFinanceData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [paymentsRes, expensesRes, feeRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*, students(name, admission_number)')
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('fee_structures')
          .select('*')
          .order('grade_level', { ascending: true })
      ])

      if (paymentsRes.error) throw paymentsRes.error
      if (expensesRes.error) throw expensesRes.error
      if (feeRes.error) throw feeRes.error

      setPayments((paymentsRes.data || []) as PaymentWithStudent[])
      setExpenses((expensesRes.data || []) as Expense[])
      setFeeStructures((feeRes.data || []) as FeeStructure[])
    } catch (err: any) {
      console.error('[useFinance] Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFinanceData()
  }, [fetchFinanceData])

  // ── Actions ──────────────────────────────────────────────────

  const addPayment = async (payment: Partial<PaymentTransaction>) => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          id: payment.id || crypto.randomUUID(),
          date: payment.date || new Date().toISOString(),
        })

      if (error) throw error
      await fetchFinanceData()
      return { success: true }
    } catch (err: any) {
      console.error('[useFinance] Add payment error:', err)
      return { success: false, error: err.message }
    }
  }

  const addExpense = async (expense: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          id: expense.id || crypto.randomUUID(),
          date: expense.date || new Date().toISOString(),
        })

      if (error) throw error
      await fetchFinanceData()
      return { success: true }
    } catch (err: any) {
      console.error('[useFinance] Add expense error:', err)
      return { success: false, error: err.message }
    }
  }

  const upsertFeeStructure = async (fee: Partial<FeeStructure>) => {
    try {
      const { error } = await supabase
        .from('fee_structures')
        .upsert({
          ...fee,
          id: fee.id || crypto.randomUUID(),
        })

      if (error) throw error
      await fetchFinanceData()
      return { success: true }
    } catch (err: any) {
      console.error('[useFinance] Upsert fee structure error:', err)
      return { success: false, error: err.message }
    }
  }

  // ── Metrics ──────────────────────────────────────────────────

  const getDashboardMetrics = () => {
    const totalCollected     = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
    const outstandingBalance = payments.reduce((sum, p) => sum + (p.balance || 0), 0)
    const totalExpenses      = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netPosition        = totalCollected - totalExpenses

    return {
      totalCollected,
      outstandingBalance,
      totalExpenses,
      netPosition
    }
  }

  return {
    payments,
    expenses,
    feeStructures,
    loading,
    error,
    addPayment,
    addExpense,
    upsertFeeStructure,
    getDashboardMetrics,
    refreshFinance: fetchFinanceData
  }
}
