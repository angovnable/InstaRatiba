import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFinance } from '@/hooks/useFinance'
import { Button, Card, Badge, Modal, SkeletonLoader } from '@/components/ui'
import { toast } from 'sonner'
import PaymentForm from './PaymentForm'
import ExpenseForm from './ExpenseForm'
import FeeStructureForm from './FeeStructureForm'

// ── KES Formatter ─────────────────────────────────────────────
const formatKES = (val: number) => 
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(val)

// ── KPI Card Component ────────────────────────────────────────
function KpiCard({ title, value, icon, color, delay }: { title: string, value: string, icon: string, color: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-label mb-1">{title}</p>
            <h3 className="text-xl font-black text-[--color-text]">{value}</h3>
          </div>
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <i className={icon} />
          </div>
        </div>
        <div 
          className="absolute -right-4 -bottom-4 text-6xl opacity-[0.03] transition-transform group-hover:scale-110"
          style={{ color }}
        >
          <i className={icon} />
        </div>
      </Card>
    </motion.div>
  )
}

// ── Main Module ───────────────────────────────────────────────
export default function FinanceModule() {
  const { 
    payments, expenses, feeStructures, loading, error, 
    addPayment, addExpense, upsertFeeStructure, getDashboardMetrics 
  } = useFinance()
  
  const [activeTab, setActiveTab] = useState<'fees' | 'expenses' | 'structures'>('fees')
  const [modal, setModal] = useState<{ type: 'payment' | 'expense' | 'fee', open: boolean }>({ type: 'payment', open: false })

  const metrics = getDashboardMetrics()

  if (loading && payments.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonLoader key={i} lines={2} />)}
        </div>
        <SkeletonLoader lines={10} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[--color-text]">Finance Dashboard</h1>
          <p className="text-sm text-[--color-muted]">Track revenue, expenses, and fee structures.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModal({ type: 'expense', open: true })} icon="bi-dash-circle">Add Expense</Button>
          <Button variant="primary" onClick={() => setModal({ type: 'payment', open: true })} icon="bi-plus-circle">Record Payment</Button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Collected"   value={formatKES(metrics.totalCollected)}     icon="bi-cash-stack"     color="#0D3D23" delay={0} />
        <KpiCard title="Pending Balances"  value={formatKES(metrics.outstandingBalance)} icon="bi-clock-history"   color="#C8922A" delay={0.1} />
        <KpiCard title="Total Expenses"    value={formatKES(metrics.totalExpenses)}      icon="bi-receipt"        color="#A01F1F" delay={0.2} />
        <KpiCard title="Net Position"      value={formatKES(metrics.netPosition)}       icon="bi-wallet2"        color="#1E5C8A" delay={0.3} />
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[--color-accent-light] w-fit shadow-sm">
          {[
            { id: 'fees',       label: 'Fee Collection', icon: 'bi-bank' },
            { id: 'expenses',   label: 'School Expenses', icon: 'bi-cart4' },
            { id: 'structures', label: 'Fee Structures',  icon: 'bi-layers' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-[--color-surface] text-[--color-primary] shadow-sm' 
                  : 'text-[--color-muted] hover:text-[--color-text]'
              }`}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="overflow-hidden border-[--color-accent-light]">
          <AnimatePresence mode="wait">
            {activeTab === 'fees' && (
              <motion.div
                key="fees"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="overflow-x-auto"
              >
                <table className="w-full text-left text-sm">
                  <thead className="bg-[--color-surface] text-[--color-muted] font-ui uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3 text-right">Amount Paid</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-accent-light]">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-[--color-surface]/30 transition-colors">
                        <td className="px-5 py-4 font-semibold text-[--color-text]">
                          {p.students?.name || 'Unknown Student'}
                          <p className="text-[10px] text-[--color-muted] font-normal">{p.students?.admission_number}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">{p.reference_number}</td>
                        <td className="px-5 py-4 text-right font-bold text-[--color-primary]">{formatKES(p.amount_paid)}</td>
                        <td className="px-5 py-4 text-right text-[--color-red]">{formatKES(p.balance)}</td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant={p.status === 'Fully Paid' ? 'success' : p.status === 'Partial' ? 'warning' : 'error'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-[--color-muted] text-xs">
                          {new Date(p.date).toLocaleDateString('en-KE')}
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-[--color-muted]">No payment records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="overflow-x-auto"
              >
                <table className="w-full text-left text-sm">
                  <thead className="bg-[--color-surface] text-[--color-muted] font-ui uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-accent-light]">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-[--color-surface]/30 transition-colors">
                        <td className="px-5 py-4 font-semibold text-[--color-text]">
                          <Badge variant="info">{e.category}</Badge>
                        </td>
                        <td className="px-5 py-4 text-[--color-text]">{e.description}</td>
                        <td className="px-5 py-4 text-right font-bold text-[--color-red]">{formatKES(e.amount)}</td>
                        <td className="px-5 py-4 text-[--color-muted] text-xs">
                          {new Date(e.date).toLocaleDateString('en-KE')}
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-[--color-muted]">No expense records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'structures' && (
              <motion.div
                key="structures"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {feeStructures.map(f => (
                  <Card key={f.id} className="p-4 space-y-3 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-[--color-text]">{f.grade_level}</h4>
                        <p className="text-[10px] text-[--color-muted] uppercase">{f.academic_year} • {f.term}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'fee', open: true })}>Edit</Button>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-[--color-accent-light]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[--color-muted]">Tuition</span>
                        <span className="font-medium">{formatKES(f.tuition)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[--color-muted]">Transport</span>
                        <span className="font-medium">{formatKES(f.transport)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[--color-muted]">Lunch</span>
                        <span className="font-medium">{formatKES(f.lunch)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[--color-muted]">Exams</span>
                        <span className="font-medium">{formatKES(f.exams)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[--color-accent-light] font-bold text-[--color-primary]">
                        <span>Total</span>
                        <span>{formatKES(f.total_required)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
                <button 
                  onClick={() => setModal({ type: 'fee', open: true })}
                  className="h-full min-h-[160px] border-2 border-dashed border-[--color-accent-light] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[--color-gold] transition-colors text-[--color-muted] hover:text-[--color-gold]"
                >
                  <i className="bi bi-plus-circle text-2xl" />
                  <span className="text-sm font-semibold">New Structure</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <Modal 
        isOpen={modal.open} 
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.type === 'payment' ? 'Record Fee Payment' : modal.type === 'expense' ? 'Record School Expense' : 'Fee Structure Editor'}
        size={modal.type === 'fee' ? 'lg' : 'md'}
      >
        {modal.type === 'payment' && (
          <PaymentForm 
            onSuccess={() => { setModal({ ...modal, open: false }); toast.success('Payment recorded successfully') }} 
            onSubmit={addPayment}
          />
        )}
        {modal.type === 'expense' && (
          <ExpenseForm 
            onSuccess={() => { setModal({ ...modal, open: false }); toast.success('Expense recorded successfully') }}
            onSubmit={addExpense}
          />
        )}
        {modal.type === 'fee' && (
          <FeeStructureForm 
            onSuccess={() => { setModal({ ...modal, open: false }); toast.success('Fee structure updated') }}
            onSubmit={upsertFeeStructure}
          />
        )}
      </Modal>
    </div>
  )
}
