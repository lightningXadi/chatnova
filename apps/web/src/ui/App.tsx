import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'
import { LoginPage } from './auth/LoginPage'
import { SignupPage } from './auth/SignupPage'
import { AppShell } from './shell/AppShell'
import { FullPageSkeleton } from './components/Skeletons'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const loc = useLocation()
  if (status === 'unknown') return <FullPageSkeleton />
  if (status !== 'signed_in') return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return children
}

export function App() {
  const hydrate = useAuth((s) => s.hydrate)
  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

