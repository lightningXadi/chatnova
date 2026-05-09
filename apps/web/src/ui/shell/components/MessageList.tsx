import { useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import type { MessageDTO } from '../../../lib/ws'
import { MessageRow } from './MessageRow'
import { MessageRowSkeleton } from './MessageRowSkeleton'

type Row = { kind: 'message'; msg: MessageDTO; showHeader: boolean } | { kind: 'unreadDivider' }

export function MessageList({
  messages,
  meId,
  isLoading,
  typingLine,
}: {
  messages: MessageDTO[]
  meId: string
  isLoading: boolean
  typingLine: string | null
}) {
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    let prev: MessageDTO | null = null
    for (const msg of messages) {
      const showHeader =
        !prev ||
        prev.authorId !== msg.authorId ||
        Math.abs(msg.createdAt - prev.createdAt) > 5 * 60 * 1000
      out.push({ kind: 'message', msg, showHeader })
      prev = msg
    }
    return out
  }, [messages])

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <MessageRowSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="h-full">
        <div className="px-4 py-4">{/* Empty state is shown by route above. */}</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Virtuoso
        style={{ height: '100%' }}
        data={rows}
        followOutput="smooth"
        initialTopMostItemIndex={rows.length - 1}
        itemContent={(_, row) => {
          if (row.kind === 'unreadDivider') return <UnreadDivider />
          return <MessageRow msg={row.msg} showHeader={row.showHeader} meId={meId} />
        }}
        components={{
          Footer: () =>
            typingLine ? (
              <div className="px-4 pb-3 pt-2 text-xs text-white/60">
                <TypingDots /> {typingLine}
              </div>
            ) : (
              <div className="h-2" />
            ),
        }}
      />
    </div>
  )
}

function UnreadDivider() {
  return (
    <div className="my-3 flex items-center gap-3 px-4">
      <div className="h-px flex-1 bg-white/10" />
      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
        New messages
      </div>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, verticalAlign: 'middle' }} aria-hidden="true">
      <style>{`
        @keyframes tdot { 0%,80%,100%{transform:translateY(0);opacity:0.3} 40%{transform:translateY(-4px);opacity:1} }
      `}</style>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
          background: '#6B6778',
          animation: `tdot 1.2s ease-in-out ${i * 150}ms infinite`,
        }} />
      ))}
    </span>
  )
}

