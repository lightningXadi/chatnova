import { Link } from 'react-router-dom'

export function AuthLayout({
  title, subtitle, children,
}: {
  title: string
  subtitle: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100%', background: '#16151A', display: 'flex' }}>
      {/* Left panel */}
      <div
        style={{
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 64px',
          width: '50%',
          background: '#1C1B21',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
        className="lg-flex"
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #E8A44A, #D479A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: 'white',
            }}
          >
            CN
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#F0EEF5', letterSpacing: '-0.02em' }}>
            ChatNova
          </span>
        </div>

        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', color: '#F0EEF5', lineHeight: 1.15, marginBottom: 16 }}>
          Where teams
          <br />
          <span style={{ color: '#E8A44A' }}>come together.</span>
        </h1>

        <p style={{ fontSize: 15, color: '#6B6778', lineHeight: 1.7, maxWidth: 340, marginBottom: 40 }}>
          Real-time messaging, organized spaces, and seamless collaboration — all in one place.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '⬡', label: 'Organized Spaces', color: '#8B7FD4', bg: 'rgba(139,127,212,0.12)' },
            { icon: '⚡', label: 'Real-time Chat', color: '#E8A44A', bg: 'rgba(232,164,74,0.12)' },
            { icon: '↗', label: 'File Sharing', color: '#7EB8D4', bg: 'rgba(126,184,212,0.12)' },
            { icon: '◉', label: 'Direct Messages', color: '#4CAF82', bg: 'rgba(76,175,130,0.12)' },
          ].map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: f.color, flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <span style={{ fontSize: 14, color: '#A09CB0' }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Mock preview */}
        <div
          style={{
            marginTop: 48,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#22202A',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF82' }} />
            <span style={{ fontSize: 11, color: '#6B6778', fontWeight: 500 }}># design-team · 3 online</span>
          </div>
          {[
            { name: 'Sara', text: 'Just pushed the new designs! 🎨', bg: '#2C1E30', col: '#D479A0' },
            { name: 'Alex', text: 'These look incredible, great work 👏', bg: '#1E2E40', col: '#7EB8D4' },
            { name: 'Maya', text: 'Can we sync tomorrow about v2?', bg: '#2C2040', col: '#B48EE0' },
          ].map((msg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 2 ? 10 : 0 }}>
              <div
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: msg.bg, color: msg.col,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}
              >
                {msg.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: msg.col, marginBottom: 1 }}>{msg.name}</div>
                <div style={{ fontSize: 12, color: '#A09CB0' }}>{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }} className="lg-hidden">
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'linear-gradient(135deg, #E8A44A, #D479A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: 'white',
            }}
          >
            CN
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F0EEF5' }}>ChatNova</span>
        </div>

        {/* Form card */}
        <div
          style={{
            width: '100%', maxWidth: 400,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.09)',
            background: '#1C1B21',
            padding: '32px 32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#F0EEF5', marginBottom: 6 }}>
              {title}
            </h2>
            <p style={{ fontSize: 13, color: '#6B6778' }}>{subtitle}</p>
          </div>
          {children}
        </div>

        <div style={{ marginTop: 24 }}>
          <Link
            to="/app"
            style={{ fontSize: 12, color: '#413E4E', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6B6778')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#413E4E')}
          >
            Skip to app →
          </Link>
        </div>
      </div>
    </div>
  )
}
