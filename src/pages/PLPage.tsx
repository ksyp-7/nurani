import { useState, Fragment, type FormEvent } from 'react'
import { getPL, getPLBreakdown } from '../api/expenseApi'
import { fmt } from '../api/format'
import type { PLResult, PLBreakdown } from '../types'

function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function PLPage() {
  const [startDate, setStartDate] = useState(startOfMonth)
  const [endDate, setEndDate] = useState(todayStr)
  const [result, setResult] = useState<PLResult | null>(null)
  const [breakdown, setBreakdown] = useState<PLBreakdown | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    const [res, bd] = await Promise.all([
      getPL(startDate, endDate),
      getPLBreakdown(startDate, endDate),
    ])
    setResult(res)
    setBreakdown(bd)
    setExpanded(new Set())
    setLoading(false)
  }

  const matByDate = new Map<string, { total: number; categories: Map<string, number> }>()
  if (breakdown) {
    for (const r of breakdown.material) {
      let day = matByDate.get(r.date)
      if (!day) {
        day = { total: 0, categories: new Map() }
        matByDate.set(r.date, day)
      }
      day.total += r.amount
      day.categories.set(r.category_name, (day.categories.get(r.category_name) ?? 0) + r.amount)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Profit &amp; Loss</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Select Date Range</h3>
        </div>
        <form onSubmit={handleSubmit} className="inline-form">
          <div className="form-row">
            <div className="field">
              <label htmlFor="startDate">From</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="field">
              <label htmlFor="endDate">To</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            Calculate
          </button>
        </form>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
        </div>
      )}

      {result && breakdown && !loading && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Sales</span>
              <span className="stat-value text-green">₹{fmt(result.total_sales)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Material Used</span>
              <span className="stat-value text-red">₹{fmt(result.total_material)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Fixed Cost</span>
              <span className="stat-value text-red">₹{fmt(result.total_fixed_cost)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Net {result.profit_loss >= 0 ? 'Profit' : 'Loss'}</span>
              <span className={`stat-value ${result.profit_loss >= 0 ? 'text-green' : 'text-red'}`}>
                ₹{fmt(result.profit_loss)}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Breakdown</h3>
            </div>
            <div className="table-wrap">
              <table className="tree-table">
                <tbody>
                  {/* === SALES === */}
                  <tr className="tree-parent" onClick={() => toggle('sales')}>
                    <td>
                      <span className="tree-arrow">{expanded.has('sales') ? '▼' : '▶'}</span>
                      Sales
                    </td>
                    <td className="num text-green">₹{fmt(result.total_sales)}</td>
                  </tr>
                  {expanded.has('sales') &&
                    breakdown.sales.map((r) => (
                      <tr className="tree-child" key={r.date}>
                        <td>{r.date}</td>
                        <td className="num text-green">₹{fmt(r.amount)}</td>
                      </tr>
                    ))}

                  {/* === MATERIAL USED === */}
                  <tr className="tree-parent" onClick={() => toggle('material')}>
                    <td>
                      <span className="tree-arrow">{expanded.has('material') ? '▼' : '▶'}</span>
                      Material Used
                    </td>
                    <td className="num text-red">₹{fmt(result.total_material)}</td>
                  </tr>
                  {expanded.has('material') &&
                    [...matByDate.entries()].map(([date, day]) => (
                      <Fragment key={date}>
                        <tr
                          className="tree-child tree-parent"
                          onClick={(e) => { e.stopPropagation(); toggle(`mat-date-${date}`) }}
                        >
                          <td>
                            <span className="tree-arrow-sub">{expanded.has(`mat-date-${date}`) ? '▼' : '▶'}</span>
                            {date}
                          </td>
                          <td className="num text-red">₹{fmt(day.total)}</td>
                        </tr>
                        {expanded.has(`mat-date-${date}`) &&
                          [...day.categories.entries()].map(([cat, amt]) => (
                            <tr className="tree-grandchild" key={`${date}-${cat}`}>
                              <td>{cat}</td>
                              <td className="num text-red">₹{fmt(amt)}</td>
                            </tr>
                          ))}
                      </Fragment>
                    ))}

                  {/* === FIXED COST === */}
                  <tr>
                    <td>
                      Fixed Cost
                      <span className="fixed-detail">
                        {' '}(₹{fmt(breakdown.daily_fixed_cost)} × {breakdown.num_days}d)
                      </span>
                    </td>
                    <td className="num text-red">₹{fmt(result.total_fixed_cost)}</td>
                  </tr>

                  {/* === NET P&L === */}
                  <tr className="tree-total">
                    <td>{result.profit_loss >= 0 ? 'Net Profit' : 'Net Loss'}</td>
                    <td className={`num ${result.profit_loss >= 0 ? 'text-green' : 'text-red'}`}>
                      ₹{fmt(Math.abs(result.profit_loss))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
