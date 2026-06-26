import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import ProtectedRoute from './pages/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import CategoriesPage from './pages/CategoriesPage'
import LedgerFormPage from './pages/LedgerFormPage'
import BalanceViewPage from './pages/BalanceViewPage'
import LedgerHistoryPage from './pages/LedgerHistoryPage'
import ReportsPage from './pages/ReportsPage'
import { exportToExcel } from './api/exportToExcel'
import './App.css'

function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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

  return (
    <nav>
      <span className="brand">Nurani Cafe</span>
      <div className="nav-links">
        <NavLink to="/">Balance</NavLink>
        <NavLink to="/categories">Categories</NavLink>
        <NavLink to="/ledger/new">New Entry</NavLink>
        <NavLink to="/ledger/history">History</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </div>
      <div className="nav-right">
        <button className="btn btn-sm btn-ghost" onClick={handleExport}>
          Export Excel
        </button>
        <span className="nav-email">{user?.email}</span>
        <button className="btn btn-sm btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
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
