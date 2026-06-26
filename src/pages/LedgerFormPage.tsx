import { useState, useEffect, type FormEvent } from 'react'
import { getCategories, insertLedgerEntry } from '../api/expenseApi'
import type { Category } from '../types'

export default function LedgerFormPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [txnType, setTxnType] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [amount, setAmount] = useState('')
  const [refNote, setRefNote] = useState('')
  const [isWastage, setIsWastage] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!categoryId || !amount || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      await insertLedgerEntry({
        category_id: Number(categoryId),
        date,
        txn_type: txnType,
        amount: Number(amount),
        ref_note: refNote || undefined,
        is_wastage: txnType === 'DEBIT' ? isWastage : false,
      })
      setMessage({ type: 'success', text: 'Entry recorded successfully' })
      setAmount('')
      setRefNote('')
      setIsWastage(false)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to record entry' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', padding: '80px 0' }}>
        <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>New Ledger Entry</h2>
      </div>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Entry Details</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="txnType">Transaction Type *</label>
              <select
                id="txnType"
                value={txnType}
                onChange={(e) => {
                  setTxnType(e.target.value as 'CREDIT' | 'DEBIT')
                  if (e.target.value === 'CREDIT') setIsWastage(false)
                }}
                disabled={submitting}
              >
                <option value="CREDIT">Credit — Stock Added</option>
                <option value="DEBIT">Debit — Stock Used</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="amount">Amount (₹) *</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="refNote">Reference Note</label>
            <input
              id="refNote"
              value={refNote}
              onChange={(e) => setRefNote(e.target.value)}
              placeholder="Invoice #, bill ref, or any note"
              disabled={submitting}
            />
          </div>

          {txnType === 'DEBIT' && (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={isWastage}
                onChange={(e) => setIsWastage(e.target.checked)}
                disabled={submitting}
              />
              <span>Mark as wastage</span>
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? <span className="spinner" /> : null}
            {submitting ? 'Recording...' : 'Record Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}
