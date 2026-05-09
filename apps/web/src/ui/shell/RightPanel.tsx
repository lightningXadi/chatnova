import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ImageIcon, Link2, FileText, ChevronDown, ChevronRight, Phone, Video, Pin } from 'lucide-react'
import { api } from '../../lib/api'

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

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const col = avatarColor(name)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', width: size, height: size,
        fontSize: size * 0.35, fontWeight: 700,
        background: col.bg, color: col.text, flexShrink: 0,
      }}
    >
      {initials}
    </span>
  )
}

type Member = { id: string; displayName: string; role: string; online?: boolean }

const photos = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=120&h=120&fit=crop',
]

export function RightPanel() {
  const { workspaceId } = useParams<{ workspaceId?: string }>()
  const [filesExpanded, setFilesExpanded] = useState(true)
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null)

  const { data: membersData } = useQuery<{ members: Member[] }>({
    queryKey: ['workspace', workspaceId, 'members'],
    queryFn: () => api<{ members: Member[] }>(`/api/workspaces/${workspaceId}/members`),
    enabled: Boolean(workspaceId),
  })

  const members: Member[] = membersData?.members ?? []

  return (
    <aside
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: 260,
        background: '#1C1B21',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0, overflowY: 'auto',
      }}
    >
      {/* Action buttons — only show functional ones */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Voice call */}
        <button
          title="Start voice call"
          onClick={() => setActiveCall(activeCall === 'voice' ? null : 'voice')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
            background: activeCall === 'voice' ? 'rgba(76,175,130,0.18)' : 'rgba(255,255,255,0.04)',
            color: activeCall === 'voice' ? '#4CAF82' : '#6B6778',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { if (activeCall !== 'voice') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { if (activeCall !== 'voice') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
        >
          <Phone size={14} />
        </button>

        {/* Video call */}
        <button
          title="Start video call"
          onClick={() => setActiveCall(activeCall === 'video' ? null : 'video')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeCall === 'video' ? 'rgba(76,175,130,0.18)' : 'rgba(255,255,255,0.04)',
            color: activeCall === 'video' ? '#4CAF82' : '#6B6778',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { if (activeCall !== 'video') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { if (activeCall !== 'video') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
        >
          <Video size={14} />
        </button>

        {/* Pin — decorative for now, clearly labelled */}
        <button
          title="Pinned messages (coming soon)"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 34, borderRadius: 8, border: 'none', cursor: 'default',
            background: 'rgba(255,255,255,0.04)', color: '#413E4E',
            transition: 'all 0.15s',
          }}
        >
          <Pin size={14} />
        </button>
      </div>

      {/* Active call banner */}
      {activeCall && (
        <div style={{
          margin: '10px 12px 0',
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(76,175,130,0.1)',
          border: '1px solid rgba(76,175,130,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4CAF82',
              animation: 'pulse 2s infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: '#4CAF82', fontWeight: 500 }}>
              {activeCall === 'voice' ? 'Voice call active' : 'Video call active'}
            </span>
          </div>
          <button
            onClick={() => setActiveCall(null)}
            style={{
              fontSize: 11, color: '#E07070', background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 600, padding: '2px 6px',
            }}
          >
            End
          </button>
        </div>
      )}

      <div style={{ padding: '16px 16px 0', flex: 1 }}>

        {/* Members section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#6B6778', marginBottom: 10,
          }}>
            Members {members.length > 0 && `· ${members.length}`}
          </div>

          {!workspaceId ? (
            <div style={{ fontSize: 12, color: '#413E4E', padding: '4px 0' }}>Open a space first.</div>
          ) : members.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[34, 28, 34].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ width: `${w}%`, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {members.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 8px', borderRadius: 9, cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={m.displayName} size={34} />
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 9, height: 9, borderRadius: '50%',
                      border: '2px solid #1C1B21',
                      background: m.online ? '#4CAF82' : '#4A4757',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: '#F0EEF5',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {m.displayName}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B6778', textTransform: 'capitalize' }}>
                      {m.role}
                    </div>
                  </div>
                  {m.role === 'admin' && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(180,142,224,0.15)', color: '#B48EE0', flexShrink: 0,
                    }}>
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18 }} />

        {/* Files section */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setFilesExpanded((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
            }}
          >
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#6B6778',
            }}>
              Files
            </span>
            {filesExpanded
              ? <ChevronDown size={13} color="#6B6778" />
              : <ChevronRight size={13} color="#6B6778" />}
          </button>

          {filesExpanded && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', marginBottom: 6 }}>
                <ImageIcon size={14} color="#6B6778" />
                <span style={{ fontSize: 13, color: '#A09CB0', flex: 1 }}>115 photos</span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 4, marginBottom: 12, borderRadius: 10, overflow: 'hidden',
              }}>
                {photos.map((src, i) => (
                  <div key={i} style={{ aspectRatio: '1', background: '#2A2833', overflow: 'hidden', cursor: 'pointer' }}>
                    <img
                      src={src} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', marginBottom: 4, cursor: 'pointer' }}>
                <FileText size={14} color="#6B6778" />
                <span style={{ fontSize: 13, color: '#A09CB0', flex: 1 }}>208 files</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer' }}>
                <Link2 size={14} color="#6B6778" />
                <span style={{ fontSize: 13, color: '#A09CB0', flex: 1 }}>47 shared links</span>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
