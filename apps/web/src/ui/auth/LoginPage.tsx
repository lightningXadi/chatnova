import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const login = useAuth((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const nextPath = useMemo(() => {
    const st = loc.state as { from?: string } | null
    return st?.from || '/app'
  }, [loc.state])

  // After showing success animation, redirect
  useEffect(() => {
    if (!loginSuccess) return
    const t = setTimeout(() => nav(nextPath, { replace: true }), 1200)
    return () => clearTimeout(t)
  }, [loginSuccess, nav, nextPath])

  if (loginSuccess) {
    return (
      <div
        style={{
          minHeight: '100%',
          background: '#16151A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <style>{`
          @keyframes successRing {
            0% { transform: scale(0.6); opacity: 0; }
            60% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes checkDraw {
            from { stroke-dashoffset: 50; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes successFadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes progressBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ animation: 'successRing 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <svg viewBox="0 0 56 56" fill="none" width="56" height="56">
              <circle cx="28" cy="28" r="27" fill="rgba(76,175,130,0.12)" stroke="#4CAF82" strokeWidth="1.5" />
              <polyline
                points="16,29 24,37 40,20"
                stroke="#4CAF82"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'checkDraw 0.4s ease 0.3s forwards' }}
              />
            </svg>
          </div>
          <div style={{ animation: 'successFadeUp 0.4s ease 0.4s both' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#F0EEF5', marginBottom: 4 }}>Welcome back!</p>
            <p style={{ fontSize: 13, color: '#6B6778' }}>Taking you in…</p>
          </div>
          <div style={{
            width: 120, height: 2, borderRadius: 2,
            background: 'rgba(255,255,255,0.07)',
            overflow: 'hidden',
            animation: 'successFadeUp 0.4s ease 0.5s both',
          }}>
            <div style={{
              height: '100%',
              background: '#4CAF82',
              borderRadius: 2,
              animation: 'progressBar 1s ease 0.6s both',
            }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          New here?{' '}
          <Link
            className="font-medium transition-colors"
            style={{ color: '#E8A44A' }}
            to="/signup"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setBusy(true)
          try {
            await login(email.trim(), password)
            setLoginSuccess(true)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in.')
            setBusy(false)
          }
        }}
      >
        <div className="animate-fade-up stagger-1 space-y-1">
          <label className="block text-xs font-medium" style={{ color: '#A09CB0' }}>
            Email
          </label>
          <input
            className="w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-200"
            style={{
              background: '#22202A',
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#F0EEF5',
            }}
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="animate-fade-up stagger-2 space-y-1">
          <label className="block text-xs font-medium" style={{ color: '#A09CB0' }}>
            Password
          </label>
          <input
            className="w-full rounded-xl border px-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-200"
            style={{
              background: '#22202A',
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#F0EEF5',
            }}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? (
          <div
            className="animate-fade-up rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: 'rgba(224,112,112,0.25)',
              background: 'rgba(224,112,112,0.08)',
              color: '#E07070',
            }}
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="animate-fade-up stagger-3 pt-1">
          <button
            className="relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
            style={{
              background: busy ? 'rgba(232,164,74,0.5)' : '#E8A44A',
              color: '#16151A',
              transform: busy ? 'scale(0.99)' : 'scale(1)',
            }}
            disabled={busy}
            type="submit"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
