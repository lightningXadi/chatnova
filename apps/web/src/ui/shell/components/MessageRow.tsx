import { useRef, useState } from 'react'
import { Trash2, Pencil, SmilePlus } from 'lucide-react'
import type { MessageDTO } from '../../../lib/ws'
import { useAuth } from '../../../state/auth'
import { api } from '../../../lib/api'

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

function Avatar({ name }: { name: string }) {
  const col = avatarColor(name)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
  return (
    <div
      style={{
        width: 34, height: 34,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        background: col.bg, color: col.text,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MessageRow({
  msg, showHeader, meId,
}: {
  msg: MessageDTO
  showHeader: boolean
  meId: string
}) {
  const isMe = msg.authorId === meId
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.markdown || '')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const me = useAuth((s) => s.me)

  if (msg.deletedAt) {
    return (
      <div style={{ padding: '2px 20px 2px 20px' }}>
        <span style={{ fontSize: 12, fontStyle: 'italic', color: '#413E4E' }}>
          This message was deleted.
        </span>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    try {
      await api(`/api/messages/${msg.id}`, { method: 'DELETE' })
    } catch {}
  }

  const handleEdit = async () => {
    if (!editing) { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); return }
    try {
      await api(`/api/messages/${msg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ markdown: editText }),
      })
    } catch {}
    setEditing(false)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 10,
        padding: showHeader ? '12px 20px 3px' : '2px 20px',
        position: 'relative',
        background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Avatar column */}
      <div style={{ width: 34, flexShrink: 0, paddingTop: showHeader ? 0 : 2 }}>
        {showHeader ? (
          <Avatar name={msg.authorDisplayName} />
        ) : (
          hovered ? (
            <span style={{ fontSize: 10, color: '#413E4E', display: 'block', textAlign: 'center', marginTop: 3 }}>
              {fmtTime(msg.createdAt)}
            </span>
          ) : null
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showHeader && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EEF5' }}>
              {msg.authorDisplayName}
            </span>
            <span style={{ fontSize: 11, color: '#413E4E' }}>
              {fmtTime(msg.createdAt)}
            </span>
          </div>
        )}

        {editing ? (
          <div>
            <textarea
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleEdit() }
                if (e.key === 'Escape') setEditing(false)
              }}
              style={{
                width: '100%', borderRadius: 8,
                border: '1px solid rgba(232,164,74,0.4)',
                background: '#22202A', padding: '8px 10px',
                fontSize: 13, color: '#F0EEF5',
                outline: 'none', resize: 'none', minHeight: 60,
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                onClick={handleEdit}
                style={{ padding: '4px 12px', borderRadius: 6, background: '#E8A44A', color: '#16151A', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: '#A09CB0', fontSize: 12, border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#DDDBE5', lineHeight: '21px', wordBreak: 'break-word' }}>
            {msg.markdown}
            {msg.editedAt && (
              <span style={{ fontSize: 11, color: '#413E4E', marginLeft: 6 }}>(edited)</span>
            )}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments?.map((att) => (
          <div key={att.id} style={{ marginTop: 6 }}>
            {att.mime?.startsWith('image/') ? (
              <img
                src={att.url}
                alt={att.name}
                style={{ maxWidth: 320, maxHeight: 240, borderRadius: 8, display: 'block', border: '1px solid rgba(255,255,255,0.07)' }}
              />
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  fontSize: 12, color: '#A09CB0', textDecoration: 'none',
                }}
              >
                📎 {att.name}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons on hover */}
      {hovered && !editing && (
        <div
          style={{
            position: 'absolute', top: 4, right: 16,
            display: 'flex', gap: 2,
            background: '#2A2833',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, padding: '3px 4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <ActionBtn title="React" onClick={() => {}}>
            <SmilePlus size={13} />
          </ActionBtn>
          {isMe && (
            <>
              <ActionBtn title="Edit" onClick={handleEdit}>
                <Pencil size={13} />
              </ActionBtn>
              <ActionBtn title="Delete" onClick={handleDelete} danger>
                <Trash2 size={13} />
              </ActionBtn>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ActionBtn({ children, title, onClick, danger }: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none', background: hov ? (danger ? 'rgba(224,96,96,0.15)' : 'rgba(255,255,255,0.07)') : 'transparent',
        color: hov ? (danger ? '#E07070' : '#F0EEF5') : '#6B6778',
        cursor: 'pointer', transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  )
}
