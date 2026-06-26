import { useState, useEffect } from 'react'
import { getCategories, getLedgerWithRunningBalance } from '../api/expenseApi'
import type { Category, LedgerWithBalance } from '../types'

export default function LedgerHistoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [entries, setEntries] = useState<LedgerWithBalance[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(false)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoadingCats(false))
  }, [])

  async function handleLoad(catId: string) {
    setCategoryId(catId)
    if (!catId) {
      setEntries([])
      return
    }
    setLoadingEntries(true)
    const rows = await getLedgerWithRunningBalance(Number(catId))
    setEntries(rows)
    setLoadingEntries(false)
  }

  const selectedCategory = categories.find(
    (c) => c.category_id === Number(categoryId)
  )

  if (loadingCats) {
    return (
      <div className="page" style={{ alignItems: 'center', padding: '80px 0' }}>
        <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Ledger History</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Select Category</h3>
        </div>
        <div className="field">
          <select value={categoryId} onChange={(e) => handleLoad(e.target.value)}>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
        {selectedCategory && (
          <div className="stat-row-inline">
            <span className="stat-label">Current Balance:</span>
            <span className={`stat-value-sm ${Number(selectedCategory.amount) >= 0 ? 'text-green' : 'text-red'}`}>
              ₹{Number(selectedCategory.amount).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {loadingEntries && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
        </div>
      )}

      {!loadingEntries && categoryId && entries.length === 0 && (
        <div className="card empty-state">
          <p>No entries found for this category.</p>
        </div>
      )}

      {!loadingEntries && entries.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="num">Amount (₹)</th>
                  <th className="num">Running Balance (₹)</th>
                  <th>Wastage</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>
                      <span className={`badge ${entry.txn_type.toLowerCase()}`}>
                        {entry.txn_type}
                      </span>
                    </td>
                    <td className="num">₹{Number(entry.amount).toFixed(2)}</td>
                    <td className={`num ${entry.running_balance >= 0 ? 'text-green' : 'text-red'}`}>
                      ₹{entry.running_balance.toFixed(2)}
                    </td>
                    <td>{entry.is_wastage ? 'Yes' : 'No'}</td>
                    <td className="cell-note">{entry.ref_note ?? '—'}</td>
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
