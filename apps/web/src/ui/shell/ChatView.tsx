import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Hash, PanelRight } from 'lucide-react'
import { api } from '../../lib/api'
import { CanvasSocket, type MessageDTO, type WsEvent } from '../../lib/ws'
import { useAuth } from '../../state/auth'
import { ChannelEmptyState } from './components/EmptyStates'
import { MessageComposer } from './components/MessageComposer'
import { MessageList } from './components/MessageList'

function TopBar({
  channels, dms, onOpenMobileNav,
}: {
  workspaceId: string
  channels: Array<{ id: string; name: string }>
  dms: Array<{ id: string; otherDisplayName: string }>
  onOpenMobileNav: () => void
}) {
  const location = useLocation()

  // Derive title from current URL
  const title = useMemo(() => {
    const channelMatch = location.pathname.match(/\/c\/([^/]+)/)
    const dmMatch = location.pathname.match(/\/dm\/([^/]+)/)
    if (channelMatch) {
      const ch = channels.find((c) => c.id === channelMatch[1])
      return ch ? { label: `#${ch.name}`, isChannel: true } : null
    }
    if (dmMatch) {
      const dm = dms.find((d) => d.id === dmMatch[1])
      return dm ? { label: dm.otherDisplayName, isChannel: false } : null
    }
    return null
  }, [location.pathname, channels, dms])

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#1C1B21',
        padding: '0 20px', height: 52, flexShrink: 0,
      }}
    >
      <button
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, background: 'transparent',
          border: 'none', cursor: 'pointer', color: '#6B6778', marginRight: 8,
          flexShrink: 0,
        }}
        className="md:hidden"
        onClick={onOpenMobileNav}
      >
        <PanelRight size={16} />
      </button>

      {title ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          {title.isChannel && <Hash size={15} style={{ color: '#6B6778', flexShrink: 0 }} />}
          <span style={{
            fontSize: 15, fontWeight: 600, color: '#F0EEF5',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title.label}
          </span>
        </div>
      ) : (
        <span style={{ fontSize: 15, fontWeight: 600, color: '#6B6778' }}>
          ChatNova
        </span>
      )}
    </div>
  )
}

export function ChatView({
  workspaceId, channels, dms, isNavLoading, isNavError, onRetryNav, onOpenMobileNav,
}: {
  workspaceId: string
  channels: Array<{ id: string; name: string }>
  dms: Array<{ id: string; otherDisplayName: string }>
  isNavLoading: boolean
  isNavError: boolean
  onRetryNav: () => void
  onOpenMobileNav: () => void
  onNavigate?: (to: string) => void
}) {
  const token = useAuth((s) => s.token)
  const me = useAuth((s) => s.me)
  const qc = useQueryClient()
  const sockRef = useRef<CanvasSocket | null>(null)
  const [typing, setTyping] = useState<Record<string, { displayName: string; at: number }>>({})

  const wsUrl = useMemo(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const base = `${proto}://${location.host}`
    return `${base}/api/ws?token=${encodeURIComponent(token || '')}&workspaceId=${encodeURIComponent(workspaceId)}`
  }, [token, workspaceId])

  useEffect(() => {
    if (!token) return
    const sock = new CanvasSocket(wsUrl)
    sockRef.current = sock
    sock.connect()
    const off = sock.on((ev) => { handleWsEvent(ev) })
    return () => { off(); sock.close(); sockRef.current = null }

    function handleWsEvent(ev: WsEvent) {
      if (ev.type === 'typing') {
        setTyping((cur) => {
          const next = { ...cur }
          if (ev.isTyping) next[ev.conversationId] = { displayName: ev.displayName, at: ev.at }
          else delete next[ev.conversationId]
          return next
        })
        return
      }
      if (ev.type === 'message.new' || ev.type === 'message.edit') {
        qc.setQueryData(['messages', workspaceId, ev.message.conversationId], (old: MessageDTO[] | undefined) => {
          const prev = old ?? []
          const idx = prev.findIndex((m) => m.id === ev.message.id || (m.clientMsgId && m.clientMsgId === ev.message.clientMsgId))
          if (idx >= 0) { const copy = prev.slice(); copy[idx] = ev.message; return copy }
          return [...prev, ev.message]
        })
        return
      }
      if (ev.type === 'message.delete') {
        qc.setQueryData(['messages', workspaceId, ev.conversationId], (old: MessageDTO[] | undefined) =>
          (old ?? []).map((m) => (m.id === ev.messageId ? { ...m, deletedAt: ev.at } : m)),
        )
        return
      }
      if (ev.type === 'ack') {
        qc.setQueryData(['pendingAcks', workspaceId], (old: Record<string, string> | undefined) => ({
          ...(old ?? {}), [ev.clientMsgId]: ev.serverMsgId,
        }))
        return
      }
    }
  }, [qc, token, workspaceId, wsUrl])

  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now()
      setTyping((cur) => {
        let changed = false
        const next: typeof cur = {}
        for (const [k, v] of Object.entries(cur)) {
          if (now - v.at < 3000) next[k] = v
          else changed = true
        }
        return changed ? next : cur
      })
    }, 600)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <TopBar
        workspaceId={workspaceId}
        channels={channels}
        dms={dms}
        onOpenMobileNav={onOpenMobileNav}
      />

      {isNavError ? (
        <div style={{ padding: '32px 24px' }}>
          <div style={{ borderRadius: 12, border: '1px solid rgba(224,96,96,0.2)', background: 'rgba(224,96,96,0.08)', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F0EEF5' }}>Couldn't load workspace</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#A09CB0' }}>Check your connection and try again.</div>
            <button
              style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, background: '#E8A44A', color: '#16151A', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              onClick={onRetryNav}
            >
              Retry
            </button>
          </div>
        </div>
      ) : isNavLoading ? (
        <div style={{ padding: '32px 24px', fontSize: 13, color: '#6B6778' }}>Loading…</div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={channels.length ? <Navigate to={`c/${channels[0].id}`} replace /> : <ChannelEmptyState />}
          />
          <Route
            path="c/:channelId"
            element={
              <ConversationView
                key="channel"
                workspaceId={workspaceId}
                kind="channel"
                meId={me?.id ?? ''}
                socket={sockRef.current}
                typing={typing}
              />
            }
          />
          <Route
            path="dm/:dmId"
            element={
              <ConversationView
                key="dm"
                workspaceId={workspaceId}
                kind="dm"
                meId={me?.id ?? ''}
                socket={sockRef.current}
                typing={typing}
              />
            }
          />
        </Routes>
      )}
    </div>
  )
}

function ConversationView({
  workspaceId, kind, meId, socket, typing,
}: {
  workspaceId: string
  kind: 'channel' | 'dm'
  meId: string
  socket: CanvasSocket | null
  typing: Record<string, { displayName: string; at: number }>
}) {
  const params = useParams()
  const conversationId = (kind === 'channel' ? params.channelId : params.dmId) || ''

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['messages', workspaceId, conversationId],
    queryFn: () =>
      api<{ messages: MessageDTO[] }>(
        `/api/workspaces/${workspaceId}/${kind === 'channel' ? 'channels' : 'dms'}/${conversationId}/messages?limit=50`,
      ).then((d) => d.messages),
    enabled: Boolean(conversationId),
  })

  const messages = data ?? []
  const typingLine = typing[conversationId]?.displayName ? `${typing[conversationId]!.displayName} is typing…` : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {isError ? (
        <div style={{ flex: 1, padding: '32px 24px' }}>
          <div style={{ borderRadius: 12, border: '1px solid rgba(224,96,96,0.2)', background: 'rgba(224,96,96,0.08)', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Couldn't load messages</div>
            <button
              style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, background: '#E8A44A', color: '#16151A', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MessageList messages={messages} meId={meId} isLoading={isLoading} typingLine={typingLine} />
          </div>
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: '#1C1B21',
              padding: '12px 16px 14px',
              flexShrink: 0,
            }}
          >
            <MessageComposer
              conversationId={conversationId}
              kind={kind}
              workspaceId={workspaceId}
              socket={socket}
            />
          </div>
        </>
      )}
    </div>
  )
}
