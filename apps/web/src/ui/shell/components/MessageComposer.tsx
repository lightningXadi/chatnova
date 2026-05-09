import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bold, Code, Image, Italic, Link2, Smile, SendHorizontal, Paperclip } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import type { CanvasSocket } from '../../../lib/ws'
import { api } from '../../../lib/api'

const MAX = 4000

export function MessageComposer({
  workspaceId, kind, conversationId, socket,
}: {
  workspaceId: string
  kind: 'channel' | 'dm'
  conversationId: string
  socket: CanvasSocket | null
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [attachments, setAttachments] = useState<
    Array<{ id: string; kind: 'image' | 'file'; url: string; name: string; size: number }>
  >([])
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const typingTimer = useRef<number | null>(null)
  const lastTypingSent = useRef<number>(0)

  const remaining = MAX - text.length
  const showCounter = text.length >= 3500

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      setBusy(true)
      try {
        for (const f of files.slice(0, 6)) {
          const form = new FormData()
          form.append('file', f)
          const out = await api<{ attachment: { id: string; url: string; name: string; size: number; mime: string } }>(
            `/api/workspaces/${workspaceId}/uploads`,
            { method: 'POST', body: form },
          )
          const k = out.attachment.mime.startsWith('image/') ? 'image' : 'file'
          setAttachments((cur) => [
            ...cur,
            { id: out.attachment.id, kind: k, url: out.attachment.url, name: out.attachment.name, size: out.attachment.size },
          ])
        }
      } finally {
        setBusy(false)
      }
    },
    [workspaceId],
  )

  const dropzone = useDropzone({ onDrop, noClick: true, multiple: true })

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = '0px'
    const maxH = 20 * 8 + 16
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px'
  }, [text])

  const send = useCallback(async () => {
    const body = text.trimEnd()
    if (!body && !attachments.length) return
    if (body.length > MAX) return
    if (!socket) return
    const clientMsgId = crypto.randomUUID()
    socket.send({ type: 'message.send', clientMsgId, kind, conversationId, markdown: body, attachments: attachments.map((a) => ({ id: a.id })), at: Date.now() })
    socket.send({ type: 'typing', kind, conversationId, isTyping: false, at: Date.now() })
    setText('')
    setAttachments([])
  }, [attachments, conversationId, kind, socket, text])

  const insertAroundSelection = (prefix: string, suffix: string) => {
    const el = taRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = text.slice(0, start) + prefix + text.slice(start, end) + suffix + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + prefix.length + text.slice(start, end).length + suffix.length
      el.setSelectionRange(caret, caret)
    })
  }

  const actions = useMemo(
    () => [
      { label: 'Bold', icon: <Bold size={15} />, onClick: () => insertAroundSelection('**', '**') },
      { label: 'Italic', icon: <Italic size={15} />, onClick: () => insertAroundSelection('*', '*') },
      { label: 'Code', icon: <Code size={15} />, onClick: () => insertAroundSelection('`', '`') },
      { label: 'Link', icon: <Link2 size={15} />, onClick: () => insertAroundSelection('[', '](https://)') },
    ],
    [text],
  )

  const containerBorder = focused
    ? '1px solid rgba(232,164,74,0.4)'
    : '1px solid rgba(255,255,255,0.09)'

  return (
    <div
      {...dropzone.getRootProps()}
      style={{
        borderRadius: 12,
        border: containerBorder,
        background: '#22202A',
        padding: '10px 12px',
        transition: 'border-color 0.15s',
        boxShadow: focused ? '0 0 0 3px rgba(232,164,74,0.08)' : 'none',
      }}
    >
      <input {...dropzone.getInputProps()} aria-label="File upload" />

      {/* Format toolbar — only when focused */}
      {focused && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
          {actions.map((a) => (
            <button
              key={a.label}
              title={a.label}
              onClick={a.onClick}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: 'none', background: 'transparent',
                color: '#6B6778', cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#F0EEF5' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6778' }}
            >
              {a.icon}
            </button>
          ))}
          <button
            title="Emoji"
            onClick={() => setShowEmoji((v) => !v)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'transparent', color: '#6B6778', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#F0EEF5' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6778' }}
          >
            <Smile size={15} />
          </button>

          {showCounter && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: remaining < 0 ? '#E07070' : '#6B6778' }}>
              {remaining}
            </span>
          )}
        </div>
      )}

      {showEmoji && (
        <div style={{ marginBottom: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: '#2A2833', padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {['😀','😁','😂','😊','😍','👍','🙏','🎉','🔥','✅','💡','👀','❤️','😅','😮','😬','😢','🤝','🚀','✨'].map((e) => (
              <button
                key={e}
                style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => { setText((t) => (t + e).slice(0, MAX)); taRef.current?.focus() }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {attachments.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#2A2833', padding: '4px 8px' }}>
              {a.kind === 'image' ? <Image size={13} color="#6B6778" /> : <div style={{ width: 13, height: 13, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} />}
              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: '#A09CB0' }}>{a.name}</span>
              <button
                style={{ fontSize: 11, color: '#6B6778', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                onClick={() => setAttachments((cur) => cur.filter((x) => x.id !== a.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {/* Attach icon (left side) */}
        <button
          title="Attach file"
          style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', background: 'transparent', color: '#6B6778', cursor: 'pointer', flexShrink: 0, marginBottom: 2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F0EEF5' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6B6778' }}
        >
          <Paperclip size={15} />
        </button>

        <textarea
          ref={taRef}
          placeholder="Write a message…"
          value={text}
          onChange={(e) => {
            const next = e.target.value.slice(0, MAX + 200)
            setText(next)
            if (!socket) return
            const now = Date.now()
            if (now - lastTypingSent.current > 700) {
              lastTypingSent.current = now
              socket.send({ type: 'typing', kind, conversationId, isTyping: Boolean(next.trim()), at: now })
            }
            if (typingTimer.current) window.clearTimeout(typingTimer.current)
            typingTimer.current = window.setTimeout(() => {
              socket.send({ type: 'typing', kind, conversationId, isTyping: false, at: Date.now() })
            }, 3000)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
          }}
          maxLength={MAX + 200}
          aria-label="Message input"
          style={{
            flex: 1, resize: 'none', minHeight: 36,
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 14, color: '#F0EEF5', lineHeight: '22px',
            padding: '7px 0',
          }}
        />

        <button
          disabled={busy || (!text.trim() && !attachments.length)}
          onClick={() => void send()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            border: 'none', cursor: busy || (!text.trim() && !attachments.length) ? 'not-allowed' : 'pointer',
            background: text.trim() || attachments.length ? '#E8A44A' : 'rgba(255,255,255,0.06)',
            color: text.trim() || attachments.length ? '#16151A' : '#6B6778',
            transition: 'all 0.15s',
            marginBottom: 1,
          }}
        >
          <SendHorizontal size={15} />
        </button>
      </div>

      {text.length > MAX && (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: '#E07070' }}>
          Message is too long (max 4,000 characters).
        </div>
      )}
    </div>
  )
}
