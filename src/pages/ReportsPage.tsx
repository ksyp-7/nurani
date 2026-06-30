import { useState, type FormEvent } from 'react'
import { getDailyReport } from '../api/expenseApi'
import { fmt } from '../api/format'
import type { DailyReport } from '../types'

function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(startOfMonth)
  const [endDate, setEndDate] = useState(todayStr)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    const data = await getDailyReport(startDate, endDate)
    setReports(data)
    setLoaded(true)
    setLoading(false)
  }

  const totalCredits = reports.reduce((s, r) => s + r.total_credits, 0)
  const totalDebits = reports.reduce((s, r) => s + r.total_debits, 0)
  const netChange = totalCredits - totalDebits

  return (
    <div className="page">
      <div className="page-header">
        <h2>Daily Report</h2>
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
            {loading ? 'Loading...' : 'Load Report'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
        </div>
      )}

      {loaded && !loading && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total Credits</span>
              <span className="stat-value text-green">₹{fmt(totalCredits)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Debits</span>
              <span className="stat-value text-red">₹{fmt(totalDebits)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Net Change</span>
              <span className={`stat-value ${netChange >= 0 ? 'text-green' : 'text-red'}`}>
                ₹{fmt(netChange)}
              </span>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="card empty-state">
              <p>No entries found for the selected period.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="num">Credits (₹)</th>
                      <th className="num">Debits (₹)</th>
                      <th className="num">Net Change (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td className="num text-green">₹{fmt(r.total_credits)}</td>
                        <td className="num text-red">₹{fmt(r.total_debits)}</td>
                        <td className={`num ${r.net_change >= 0 ? 'text-green' : 'text-red'}`}>
                          ₹{fmt(r.net_change)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
