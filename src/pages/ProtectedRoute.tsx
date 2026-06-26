import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <span className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
