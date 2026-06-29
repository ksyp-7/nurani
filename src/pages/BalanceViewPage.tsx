import { useState, useEffect } from 'react'
import { getCategories } from '../api/expenseApi'
import { fmt } from '../api/format'
import type { Category } from '../types'

export default function BalanceViewPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [sortField, setSortField] = useState<'category_name' | 'amount'>('category_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  function handleSort(field: 'category_name' | 'amount') {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...categories].sort((a, b) => {
    const aVal = sortField === 'category_name' ? a[sortField] : Number(a[sortField])
    const bVal = sortField === 'category_name' ? b[sortField] : Number(b[sortField])
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalBalance = categories.reduce((sum, c) => sum + Number(c.amount), 0)

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
        <h2>Category Balances</h2>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Categories</span>
          <span className="stat-value">{categories.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Balance</span>
          <span className={`stat-value ${totalBalance >= 0 ? 'text-green' : 'text-red'}`}>
            ₹{fmt(totalBalance)}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card empty-state">
          <p>No categories yet. Add one from the Categories page.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => handleSort('category_name')}
                  >
                    Category {sortField === 'category_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="sortable num"
                    onClick={() => handleSort('amount')}
                  >
                    Balance (₹) {sortField === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((cat) => (
                  <tr key={cat.category_id}>
                    <td className="cell-name">{cat.category_name}</td>
                    <td className={`num ${Number(cat.amount) >= 0 ? 'text-green' : 'text-red'}`}>
                      ₹{fmt(cat.amount)}
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
