import { LogOut, Plus, Search, Hash, Settings } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { Channel, Dm, Workspace } from './AppShell'
import { useNav } from '../../state/nav'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const AVATAR_COLORS = [
  { bg: '#2C2040', text: '#B48EE0' },
  { bg: '#1E2E40', text: '#7EB8D4' },
  { bg: '#2C1E30', text: '#D479A0' },
  { bg: '#1E3028', text: '#6BBF96' },
  { bg: '#38261E', text: '#E0906A' },
  { bg: '#2C2A1A', text: '#D4B86A' },
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]!
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const col = avatarColor(name)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        height: size, width: size,
        fontSize: size * 0.36,
        fontWeight: 700,
        background: col.bg,
        color: col.text,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  )
}

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span
      style={{
        marginLeft: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 17, height: 17,
        borderRadius: 99,
        background: 'rgba(139,127,212,0.25)',
        color: '#B4ABEC',
        fontSize: 10, fontWeight: 700,
        padding: '0 5px',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '14px 10px 5px',
        fontSize: 10, fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: '#413E4E',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  )
}

const navBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  borderRadius: 8, padding: '5px 9px',
  fontSize: 13, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.13s ease',
  textDecoration: 'none', border: 'none', outline: 'none',
  width: '100%', background: 'transparent',
}

export function LeftSidebar({
  workspaces, mobileOpen, onMobileClose, onLogout,
}: {
  workspaces: Workspace[] | null
  mobileOpen: boolean
  onMobileClose: () => void
  onLogout: () => void
}) {
  const navigate = useNavigate()
  const { activeWorkspaceId, channels, dms } = useNav()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const currentWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) ?? workspaces?.[0] ?? null

  const filteredChannels = searchQuery
    ? channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : channels
  const filteredDms = searchQuery
    ? dms.filter((d) => d.otherDisplayName.toLowerCase().includes(searchQuery.toLowerCase()))
    : dms

  const sidebar = (
    <aside
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: 240,
        background: '#1C1B21',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '13px 10px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link
          to="/app"
          style={{
            display: 'flex', alignItems: 'center', gap: 9, flex: 1,
            minWidth: 0, borderRadius: 9, padding: '5px 7px',
            textDecoration: 'none', transition: 'background 0.13s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              height: 28, width: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #E8A44A, #D479A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
            }}
          >
            CN
          </div>
          <span
            style={{
              fontSize: 14, fontWeight: 700, color: '#F0EEF5',
              letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            ChatNova
          </span>
        </Link>

        <button
          style={{ ...navBase, width: 28, height: 28, padding: 0, justifyContent: 'center', color: '#6B6778', borderRadius: 7, flexShrink: 0 }}
          onClick={() => { setSearchOpen((v) => !v); setSearchQuery('') }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#F0EEF5' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6778' }}
        >
          <Search size={13} />
        </button>

        <button
          style={{ ...navBase, width: 28, height: 28, padding: 0, justifyContent: 'center', color: '#6B6778', borderRadius: 7, flexShrink: 0 }}
          onClick={() => navigate('/app')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,127,212,0.1)'; (e.currentTarget as HTMLElement).style.color = '#8B7FD4' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6778' }}
        >
          <Plus size={13} />
        </button>
      </div>

      {searchOpen && (
        <div style={{ padding: '0 10px 8px' }}>
          <input
            autoFocus
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.09)',
              background: '#22202A', padding: '6px 11px',
              fontSize: 12, color: '#F0EEF5',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Workspace card */}
      {currentWorkspace && (
        <div style={{ padding: '0 10px 8px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)',
              background: '#22202A', padding: '7px 10px',
            }}
          >
            <Avatar name={currentWorkspace.name} size={26} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F0EEF5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentWorkspace.name}
              </div>
              <div style={{ fontSize: 10, color: '#6B6778', textTransform: 'capitalize' }}>{currentWorkspace.role}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 10px 4px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        <SectionLabel>Channels</SectionLabel>
        {activeWorkspaceId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredChannels.map((c) => (
              <NavLink
                key={c.id}
                to={`/app/w/${activeWorkspaceId}/c/${c.id}`}
                style={({ isActive }) => ({
                  ...navBase,
                  color: isActive ? '#8B7FD4' : c.unreadCount ? '#F0EEF5' : '#A09CB0',
                  background: isActive ? 'rgba(139,127,212,0.12)' : 'transparent',
                  fontWeight: c.unreadCount ? 600 : 400,
                })}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; if (!el.getAttribute('aria-current')) { el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#F0EEF5' } }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; if (!el.getAttribute('aria-current')) { el.style.background = 'transparent'; el.style.color = c.unreadCount ? '#F0EEF5' : '#A09CB0' } }}
              >
                <Hash size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
                <UnreadBadge count={c.unreadCount} />
              </NavLink>
            ))}
            {!filteredChannels.length && (
              <div style={{ padding: '5px 10px', fontSize: 12, color: '#413E4E' }}>
                {searchQuery ? 'No channels match.' : 'No channels yet.'}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '5px 10px', fontSize: 12, color: '#413E4E' }}>Open a space first.</div>
        )}

        <SectionLabel>Direct Messages</SectionLabel>
        {activeWorkspaceId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredDms.map((dm) => (
              <NavLink
                key={dm.id}
                to={`/app/w/${activeWorkspaceId}/dm/${dm.id}`}
                style={({ isActive }) => ({
                  ...navBase,
                  color: isActive ? '#8B7FD4' : dm.unreadCount ? '#F0EEF5' : '#A09CB0',
                  background: isActive ? 'rgba(139,127,212,0.12)' : 'transparent',
                  fontWeight: dm.unreadCount ? 600 : 400,
                })}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; if (!el.getAttribute('aria-current')) { el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#F0EEF5' } }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; if (!el.getAttribute('aria-current')) { el.style.background = 'transparent'; el.style.color = dm.unreadCount ? '#F0EEF5' : '#A09CB0' } }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={dm.otherDisplayName} size={24} />
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderRadius: '50%', background: '#4CAF82', border: '1.5px solid #1C1B21' }} />
                </div>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dm.otherDisplayName}
                </span>
                <UnreadBadge count={dm.unreadCount} />
              </NavLink>
            ))}
            {!filteredDms.length && (
              <div style={{ padding: '5px 10px', fontSize: 12, color: '#413E4E' }}>
                {searchQuery ? 'No DMs match.' : 'No direct messages.'}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '5px 10px', fontSize: 12, color: '#413E4E' }}>Open a space first.</div>
        )}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 8px', display: 'flex', gap: 4 }}>
        <button
          style={{ ...navBase, color: '#6B6778', fontSize: 13, flex: 1 }}
          onClick={onLogout}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,96,96,0.08)'; (e.currentTarget as HTMLElement).style.color = '#E07070' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6778' }}
        >
          <LogOut size={13} style={{ flexShrink: 0 }} />
          Sign out
        </button>
        <button
          title="Settings (coming soon)"
          style={{ ...navBase, width: 30, height: 30, padding: 0, justifyContent: 'center', color: '#6B6778', borderRadius: 7, flexShrink: 0, cursor: 'default', opacity: 0.5 }}
        >
          <Settings size={13} />
        </button>
      </div>
    </aside>
  )

  if (!mobileOpen) return <div className="hidden md:block">{sidebar}</div>

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        aria-label="Close sidebar"
        onClick={onMobileClose}
      />
      <div className="relative h-full">{sidebar}</div>
    </div>
  )
}

export function ChannelItem({ channel }: { channel: Channel }) {
  return (
    <NavLink
      to={channel.name}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
      style={{ color: '#A09CB0' }}
    >
      <Hash size={13} style={{ opacity: 0.5 }} />
      <span className="flex-1 truncate">{channel.name}</span>
    </NavLink>
  )
}

export function DmItem({ dm }: { dm: Dm }) {
  return (
    <NavLink
      to={dm.id}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
      style={{ color: '#A09CB0' }}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: '#2A2833' }}>
        {dm.otherDisplayName[0]?.toUpperCase()}
      </span>
      <span className="flex-1 truncate">{dm.otherDisplayName}</span>
    </NavLink>
  )
}
