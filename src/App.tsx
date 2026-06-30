import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import ProtectedRoute from './pages/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import CategoriesPage from './pages/CategoriesPage'
import LedgerFormPage from './pages/LedgerFormPage'
import BalanceViewPage from './pages/BalanceViewPage'
import LedgerHistoryPage from './pages/LedgerHistoryPage'
import ReportsPage from './pages/ReportsPage'
import SalesPage from './pages/SalesPage'
import FixedExpensesPage from './pages/FixedExpensesPage'
import PLPage from './pages/PLPage'
import { exportToExcel } from './api/exportToExcel'
import './App.css'

function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleExport() {
    try {
      await exportToExcel()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <>
      <nav>
        <span className="brand">Nurani Cafe</span>
        <div className="nav-links">
          <NavLink to="/" onClick={closeMenu}>Balance</NavLink>
          <NavLink to="/categories" onClick={closeMenu}>Categories</NavLink>
          <NavLink to="/ledger/new" onClick={closeMenu}>New Entry</NavLink>
          <NavLink to="/ledger/history" onClick={closeMenu}>History</NavLink>
          <NavLink to="/fixed-expenses" onClick={closeMenu}>Fixed Expenses</NavLink>
          <NavLink to="/sales" onClick={closeMenu}>Sales</NavLink>
          <NavLink to="/pnl" onClick={closeMenu}>P&amp;L</NavLink>
          <NavLink to="/reports" onClick={closeMenu}>Reports</NavLink>
        </div>
        <div className="nav-right">
          <button className="btn btn-sm btn-ghost nav-export" onClick={handleExport}>
            Export Excel
          </button>
          <span className="nav-email">{user?.email}</span>
          <button className="btn btn-sm btn-ghost" onClick={handleLogout}>
            Logout
          </button>
          <button className="hamburger" onClick={() => setMenuOpen((p) => !p)} aria-label="Menu">
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </nav>
      {menuOpen && <div className="mobile-overlay" onClick={closeMenu} />}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={closeMenu}>Balance</NavLink>
        <NavLink to="/categories" onClick={closeMenu}>Categories</NavLink>
        <NavLink to="/ledger/new" onClick={closeMenu}>New Entry</NavLink>
        <NavLink to="/ledger/history" onClick={closeMenu}>History</NavLink>
        <NavLink to="/fixed-expenses" onClick={closeMenu}>Fixed Expenses</NavLink>
        <NavLink to="/sales" onClick={closeMenu}>Sales</NavLink>
        <NavLink to="/pnl" onClick={closeMenu}>P&amp;L</NavLink>
        <NavLink to="/reports" onClick={closeMenu}>Reports</NavLink>
        <hr />
        <button className="btn btn-sm btn-ghost mobile-export" onClick={() => { handleExport(); closeMenu() }}>
          Export Excel
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => { handleLogout(); closeMenu() }}>
          Logout {user?.email}
        </button>
      </div>
    </>
  )
}

function AppLayout() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<BalanceViewPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/ledger/new" element={<LedgerFormPage />} />
          <Route path="/ledger/history" element={<LedgerHistoryPage />} />
          <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/pnl" element={<PLPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
