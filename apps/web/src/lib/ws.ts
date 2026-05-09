export type WsEvent =
  | { type: 'presence'; userId: string; status: 'online' | 'away' | 'offline'; at: number }
  | { type: 'typing'; conversationId: string; userId: string; displayName: string; isTyping: boolean; at: number }
  | { type: 'message.new'; message: MessageDTO }
  | { type: 'message.edit'; message: MessageDTO }
  | { type: 'message.delete'; messageId: string; conversationId: string; at: number }
  | { type: 'ack'; clientMsgId: string; serverMsgId: string; at: number }
  | { type: 'error'; error: string; code?: string }

export type MessageDTO = {
  id: string
  conversationId: string
  kind: 'channel' | 'dm'
  authorId: string
  authorDisplayName: string
  createdAt: number
  editedAt: number | null
  deletedAt: number | null
  markdown: string
  clientMsgId?: string
  attachments?: Array<{ id: string; kind: 'image' | 'file'; url: string; name: string; size: number }>
}

type Listener = (ev: WsEvent) => void

export class CanvasSocket {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
  private heartbeat: number | null = null
  private reconnectTimer: number | null = null
  private closedByUser = false

  constructor(private url: string) {}

  connect() {
    if (this.ws) return
    this.closedByUser = false
    this.ws = new WebSocket(this.url)
    this.ws.onmessage = (m) => {
      try {
        const ev = JSON.parse(String(m.data)) as WsEvent
        for (const l of this.listeners) l(ev)
      } catch {
        // ignore malformed event
      }
    }
    this.ws.onopen = () => {
      this.startHeartbeat()
    }
    this.ws.onclose = () => {
      this.stopHeartbeat()
      this.ws = null
      if (!this.closedByUser) this.scheduleReconnect()
    }
  }

  close() {
    this.closedByUser = true
    this.stopHeartbeat()
    this.ws?.close()
    this.ws = null
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer)
  }

  on(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  send(payload: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false
    this.ws.send(JSON.stringify(payload))
    return true
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeat = window.setInterval(() => {
      this.send({ type: 'heartbeat', at: Date.now() })
    }, 25_000)
  }

  private stopHeartbeat() {
    if (this.heartbeat) window.clearInterval(this.heartbeat)
    this.heartbeat = null
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 1200)
  }
}

