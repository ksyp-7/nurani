import { useState, useEffect, type FormEvent } from 'react'
import { getSales, createSalesEntry, updateSalesEntry, deleteSalesEntry } from '../api/expenseApi'
import { fmt } from '../api/format'
import type { SalesEntry } from '../types'

const PAGE_SIZE = 15

export default function SalesPage() {
  const [entries, setEntries] = useState<SalesEntry[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sales, setSales] = useState('')

  const [editing, setEditing] = useState<SalesEntry | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editSales, setEditSales] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const totalPages = Math.ceil(count / PAGE_SIZE)

  async function load(pageNum: number) {
    setLoading(true)
    const res = await getSales(pageNum, PAGE_SIZE)
    setEntries(res.data)
    setCount(res.count)
    setPage(pageNum)
    setLoading(false)
  }

  useEffect(() => { load(0) }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!date || !sales) return
    setSubmitting(true)
    try {
      await createSalesEntry({ date, sales: Number(sales) })
      setSales('')
      setDate(new Date().toISOString().split('T')[0])
      await load(0)
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(entry: SalesEntry) {
    setEditing(entry)
    setEditDate(entry.date)
    setEditSales(String(entry.sales))
    setEditOpen(true)
  }

  async function handleEditSave() {
    if (!editing || !editDate || !editSales) return
    setSubmitting(true)
    try {
      await updateSalesEntry(editing.id, { date: editDate, sales: Number(editSales) })
      setEditOpen(false)
      setEditing(null)
      await load(page)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this sales entry?')) return
    setSubmitting(true)
    try {
      await deleteSalesEntry(id)
      await load(page)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Sales</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Add New Entry</h3>
        </div>
        <form onSubmit={handleAdd} className="inline-form">
          <div className="field">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className="field">
            <input
              type="number"
              min="0"
              step="0.01"
              value={sales}
              onChange={(e) => setSales(e.target.value)}
              placeholder="Sales amount"
              required
              disabled={submitting}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : null}
            Add
          </button>
        </form>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="card empty-state">
          <p>No sales entries yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Sales (₹)</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td className="num text-green">₹{fmt(entry.sales)}</td>
                    <td className="actions-col">
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(entry)} disabled={submitting}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry.id)} disabled={submitting}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="page-info">
              Page {page + 1} of {totalPages} ({count} entries)
            </span>
            <div className="btn-group">
              <button
                className="btn btn-sm btn-ghost"
                disabled={page === 0 || submitting}
                onClick={() => load(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-ghost"
                disabled={page >= totalPages - 1 || submitting}
                onClick={() => load(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && editing && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Sales Entry</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="field">
                <label>Sales (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editSales}
                  onChange={(e) => setEditSales(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={submitting}>
                {submitting ? <span className="spinner" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
