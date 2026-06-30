import { useState, useEffect, type FormEvent } from 'react'
import { getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense } from '../api/expenseApi'
import { fmt } from '../api/format'
import type { FixedExpense } from '../types'

export default function FixedExpensesPage() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [editing, setEditing] = useState<FixedExpense | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    getFixedExpenses()
      .then(setExpenses)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      if (editing) {
        const updated = await updateFixedExpense(editing.id, { expense_name: name, amount: Number(amount) })
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
        setEditing(null)
        setMessage({ type: 'success', text: 'Expense updated successfully' })
      } else {
        const created = await createFixedExpense({ expense_name: name, amount: Number(amount) })
        setExpenses((prev) => [...prev, created])
        setMessage({ type: 'success', text: 'Expense added successfully' })
      }
      setName('')
      setAmount('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Operation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this fixed expense?')) return
    setSubmitting(true)
    setMessage(null)
    try {
      await deleteFixedExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      setMessage({ type: 'success', text: 'Expense deleted successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(exp: FixedExpense) {
    setEditing(exp)
    setName(exp.expense_name)
    setAmount(String(exp.amount))
    setMessage(null)
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
    setAmount('')
    setMessage(null)
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
        <h2>Fixed Expenses</h2>
      </div>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>{editing ? 'Edit Expense' : 'Add New Expense'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="inline-form">
          <div className="field">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Expense name (e.g. Rent, Electricity)"
              required
              disabled={submitting}
            />
          </div>
          <div className="field">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              required
              disabled={submitting}
            />
          </div>
          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {editing ? 'Update' : 'Add'}
            </button>
            {editing && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={submitting}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {expenses.length === 0 ? (
        <div className="card empty-state">
          <p>No fixed expenses added yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense Name</th>
                  <th className="num">Amount (₹)</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="cell-name">{exp.expense_name}</td>
                    <td className="num">₹{fmt(exp.amount)}</td>
                    <td className="actions-col">
                      <button className="btn btn-sm btn-ghost" onClick={() => startEdit(exp)} disabled={submitting}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp.id)} disabled={submitting}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
