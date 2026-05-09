import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { AuthLayout } from './AuthLayout'

export function SignupPage() {
  const nav = useNavigate()
  const signup = useAuth((s) => s.signup)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <AuthLayout
      title="Create account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link
            className="font-medium transition-colors"
            style={{ color: '#E8A44A' }}
            to="/login"
          >
            Sign in
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
            await signup(email.trim(), password, displayName.trim())
            nav('/app', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create account.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <div className="animate-fade-up stagger-1 space-y-1">
          <label className="block text-xs font-medium" style={{ color: '#A09CB0' }}>
            Display name
          </label>
          <input
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-all duration-200"
            style={{ background: '#22202A', borderColor: 'rgba(255,255,255,0.1)', color: '#F0EEF5' }}
            autoComplete="name"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            minLength={2}
            maxLength={40}
            required
          />
        </div>

        <div className="animate-fade-up stagger-2 space-y-1">
          <label className="block text-xs font-medium" style={{ color: '#A09CB0' }}>
            Email
          </label>
          <input
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-all duration-200"
            style={{ background: '#22202A', borderColor: 'rgba(255,255,255,0.1)', color: '#F0EEF5' }}
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="animate-fade-up stagger-3 space-y-1">
          <label className="block text-xs font-medium" style={{ color: '#A09CB0' }}>
            Password
          </label>
          <input
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-all duration-200"
            style={{ background: '#22202A', borderColor: 'rgba(255,255,255,0.1)', color: '#F0EEF5' }}
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
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

        <div className="animate-fade-up stagger-4 pt-1">
          <button
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
            style={{
              background: busy ? 'rgba(232,164,74,0.5)' : '#E8A44A',
              color: '#16151A',
            }}
            disabled={busy}
            type="submit"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </div>

        <p className="text-center text-[11px]" style={{ color: '#413E4E' }}>
          By creating an account you agree to our Terms of Service.
        </p>
      </form>
    </AuthLayout>
  )
}
