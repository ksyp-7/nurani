import { useState, useEffect, type FormEvent } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/expenseApi'
import type { Category } from '../types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
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
    if (!name.trim() || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      if (editing) {
        const updated = await updateCategory(editing.category_id, { category_name: name })
        setCategories((prev) => prev.map((c) => (c.category_id === updated.category_id ? updated : c)))
        setEditing(null)
        setMessage({ type: 'success', text: 'Category updated successfully' })
      } else {
        const created = await createCategory({ category_name: name })
        setCategories((prev) => [...prev, created])
        setMessage({ type: 'success', text: 'Category created successfully' })
      }
      setName('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Operation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category? This cannot be undone if no ledger entries exist.')) return
    setSubmitting(true)
    setMessage(null)
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.category_id !== id))
      setMessage({ type: 'success', text: 'Category deleted successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(cat: Category) {
    setEditing(cat)
    setName(cat.category_name)
    setMessage(null)
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
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
        <h2>Category Master</h2>
      </div>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>{editing ? 'Edit Category' : 'Add New Category'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="inline-form">
          <div className="field">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              required
              autoFocus
              disabled={submitting}
            />
          </div>
          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {editing ? 'Update' : 'Add Category'}
            </button>
            {editing && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={submitting}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {categories.length === 0 ? (
        <div className="card empty-state">
          <p>No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="num">Balance (₹)</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.category_id}>
                    <td className="cell-name">{cat.category_name}</td>
                    <td className={`num ${Number(cat.amount) >= 0 ? 'text-green' : 'text-red'}`}>
                      ₹{Number(cat.amount).toFixed(2)}
                    </td>
                    <td className="actions-col">
                      <button className="btn btn-sm btn-ghost" onClick={() => startEdit(cat)} disabled={submitting}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.category_id)} disabled={submitting}>
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
