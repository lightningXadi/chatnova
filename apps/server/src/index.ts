import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { WebSocketServer } from 'ws'
import { z } from 'zod'
import multer from 'multer'
import { openDb } from './db.js'
import { hashPassword, newId, requireAuth, signToken, verifyPassword, verifyToken } from './auth.js'

const PORT = Number(process.env.PORT || 8787)

const db = openDb()
const app = express()
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

const uploadsRoot = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadsRoot, { recursive: true })
app.use('/uploads', express.static(uploadsRoot, { maxAge: '7d', etag: true }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ---- Auth
app.post('/api/auth/signup', async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(8).max(200),
      displayName: z.string().min(2).max(40),
    })
    .safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Invalid signup details.' })

  const email = body.data.email.toLowerCase()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined
  if (existing) return res.status(409).json({ error: 'Email is already in use.' })

  const id = newId('usr')
  const now = Date.now()
  const password_hash = await hashPassword(body.data.password)
  db.prepare('INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?,?,?,?,?)').run(
    id,
    email,
    password_hash,
    body.data.displayName,
    now,
  )
  const token = signToken({ id, email })
  res.json({ token, me: { id, email, displayName: body.data.displayName } })
})

app.post('/api/auth/login', async (req, res) => {
  const body = z
    .object({ email: z.string().email(), password: z.string().min(1).max(200) })
    .safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Invalid login details.' })

  const email = body.data.email.toLowerCase()
  const user = db
    .prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?')
    .get(email) as { id: string; email: string; password_hash: string; display_name: string } | undefined
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' })
  const ok = await verifyPassword(body.data.password, user.password_hash)
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' })

  const token = signToken({ id: user.id, email: user.email })
  res.json({ token, me: { id: user.id, email: user.email, displayName: user.display_name } })
})

app.get('/api/me', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const me = db
    .prepare('SELECT id, email, display_name FROM users WHERE id = ?')
    .get(userId) as { id: string; email: string; display_name: string }
  res.json({ id: me.id, email: me.email, displayName: me.display_name })
})

// ---- Workspaces / Channels / DMs
app.get('/api/workspaces', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const rows = db
    .prepare(
      `SELECT w.id, w.name, m.role
       FROM workspaces w
       JOIN workspace_members m ON m.workspace_id = w.id
       WHERE m.user_id = ?
       ORDER BY w.created_at DESC`,
    )
    .all(userId) as Array<{ id: string; name: string; role: 'admin' | 'member' }>
  res.json({ workspaces: rows })
})

app.post('/api/workspaces', requireAuth(db), (req, res) => {
  const body = z.object({ name: z.string().min(2).max(40) }).safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Invalid workspace name.' })
  const userId = (req as any).user.id as string
  const wsId = newId('ws')
  const generalId = newId('ch')
  const now = Date.now()

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO workspaces (id, name, created_at) VALUES (?,?,?)').run(wsId, body.data.name, now)
    db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?,?,?,?)').run(
      wsId,
      userId,
      'admin',
      now,
    )
    db.prepare('INSERT INTO channels (id, workspace_id, name, is_private, created_at) VALUES (?,?,?,?,?)').run(
      generalId,
      wsId,
      'general',
      0,
      now,
    )
    db.prepare('INSERT INTO conversation_reads (workspace_id, user_id, kind, conversation_id, last_read_at) VALUES (?,?,?,?,?)').run(
      wsId,
      userId,
      'channel',
      generalId,
      now,
    )
  })
  tx()

  res.json({ workspace: { id: wsId, name: body.data.name, role: 'admin' }, defaultChannelId: generalId })
})


// ---- Invite Links
app.post('/api/workspaces/:workspaceId/invites', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const workspaceId = req.params.workspaceId as string
  const member = requireWorkspaceMember(userId, workspaceId)
  if (!member) return res.status(403).json({ error: 'Access denied.' })

  const token = newId('inv')
  const now = Date.now()
  const expires_at = now + 7 * 24 * 60 * 60 * 1000 // 7 days

  db.prepare('INSERT INTO invite_links (token, workspace_id, created_by, created_at, expires_at) VALUES (?,?,?,?,?)').run(
    token, workspaceId, userId, now, expires_at
  )
  res.json({ token })
})

app.get('/api/invites/:token', (req, res) => {
  const token = req.params.token as string
  const invite = db
    .prepare('SELECT i.token, i.workspace_id, i.expires_at, w.name as workspace_name FROM invite_links i JOIN workspaces w ON w.id = i.workspace_id WHERE i.token = ?')
    .get(token) as { token: string; workspace_id: string; expires_at: number; workspace_name: string } | undefined

  if (!invite) return res.status(404).json({ error: 'Invite link not found.' })
  if (Date.now() > invite.expires_at) return res.status(410).json({ error: 'Invite link has expired.' })

  res.json({ workspaceId: invite.workspace_id, workspaceName: invite.workspace_name })
})

app.post('/api/invites/:token/join', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const token = req.params.token as string

  const invite = db
    .prepare('SELECT workspace_id, expires_at FROM invite_links WHERE token = ?')
    .get(token) as { workspace_id: string; expires_at: number } | undefined

  if (!invite) return res.status(404).json({ error: 'Invite link not found.' })
  if (Date.now() > invite.expires_at) return res.status(410).json({ error: 'Invite link has expired.' })

  const already = db
    .prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
    .get(invite.workspace_id, userId)
  if (already) return res.json({ workspaceId: invite.workspace_id, alreadyMember: true })

  const now = Date.now()
  db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?,?,?,?)').run(
    invite.workspace_id, userId, 'member', now
  )

  res.json({ workspaceId: invite.workspace_id, alreadyMember: false })
})

function requireWorkspaceMember(userId: string, workspaceId: string) {
  const m = db
    .prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
    .get(workspaceId, userId) as { role: 'admin' | 'member' } | undefined
  return m
}

app.get('/api/workspaces/:workspaceId/nav', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const workspaceId = req.params.workspaceId as string
  if (!requireWorkspaceMember(userId, workspaceId)) return res.status(403).json({ error: 'Access denied.' })

  const channels = db
    .prepare(
      `SELECT c.id, c.name, c.is_private,
        (SELECT COUNT(1) FROM messages m
          LEFT JOIN conversation_reads r
            ON r.workspace_id = m.workspace_id AND r.user_id = ? AND r.kind = 'channel' AND r.conversation_id = c.id
          WHERE m.workspace_id = c.workspace_id
            AND m.kind = 'channel'
            AND m.conversation_id = c.id
            AND m.deleted_at IS NULL
            AND m.created_at > COALESCE(r.last_read_at, 0)
        ) as unreadCount
       FROM channels c
       WHERE c.workspace_id = ?
       ORDER BY c.created_at ASC`,
    )
    .all(userId, workspaceId) as Array<{ id: string; name: string; is_private: 0 | 1; unreadCount: number }>

  const dms = db
    .prepare(
      `SELECT d.id,
              CASE WHEN d.user_a = ? THEN d.user_b ELSE d.user_a END AS otherUserId,
              u.display_name AS otherDisplayName,
              (SELECT COUNT(1) FROM messages m
                 LEFT JOIN conversation_reads r
                   ON r.workspace_id = m.workspace_id AND r.user_id = ? AND r.kind = 'dm' AND r.conversation_id = d.id
                WHERE m.workspace_id = d.workspace_id
                  AND m.kind = 'dm'
                  AND m.conversation_id = d.id
                  AND m.deleted_at IS NULL
                  AND m.created_at > COALESCE(r.last_read_at, 0)
              ) as unreadCount
         FROM dms d
         JOIN users u ON u.id = (CASE WHEN d.user_a = ? THEN d.user_b ELSE d.user_a END)
        WHERE d.workspace_id = ? AND (d.user_a = ? OR d.user_b = ?)
        ORDER BY d.created_at DESC`,
    )
    .all(userId, userId, userId, workspaceId, userId, userId) as Array<{
    id: string
    otherUserId: string
    otherDisplayName: string
    unreadCount: number
  }>

  res.json({ channels, dms })
})

app.get('/api/workspaces/:workspaceId/channels/:channelId/messages', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const workspaceId = req.params.workspaceId as string; const channelId = req.params.channelId as string
  if (!requireWorkspaceMember(userId, workspaceId)) return res.status(403).json({ error: 'Access denied.' })
  const limit = Math.min(Number(req.query.limit || 50), 200)
  const rows = db
    .prepare(
      `SELECT m.id, m.conversation_id as conversationId, m.kind, m.author_id as authorId,
              u.display_name as authorDisplayName,
              m.created_at as createdAt, m.edited_at as editedAt, m.deleted_at as deletedAt,
              m.markdown, m.client_msg_id as clientMsgId
         FROM messages m
         JOIN users u ON u.id = m.author_id
        WHERE m.workspace_id = ? AND m.kind = 'channel' AND m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?`,
    )
    .all(workspaceId, channelId, limit) as any[]
  const messages = rows.reverse()
  res.json({ messages })
})

app.get('/api/workspaces/:workspaceId/dms/:dmId/messages', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const workspaceId = req.params.workspaceId as string; const dmId = req.params.dmId as string
  if (!requireWorkspaceMember(userId, workspaceId)) return res.status(403).json({ error: 'Access denied.' })
  const dm = db
    .prepare('SELECT id FROM dms WHERE id = ? AND workspace_id = ? AND (user_a = ? OR user_b = ?)')
    .get(dmId, workspaceId, userId, userId) as { id: string } | undefined
  if (!dm) return res.status(404).json({ error: 'DM not found.' })
  const limit = Math.min(Number(req.query.limit || 50), 200)
  const rows = db
    .prepare(
      `SELECT m.id, m.conversation_id as conversationId, m.kind, m.author_id as authorId,
              u.display_name as authorDisplayName,
              m.created_at as createdAt, m.edited_at as editedAt, m.deleted_at as deletedAt,
              m.markdown, m.client_msg_id as clientMsgId
         FROM messages m
         JOIN users u ON u.id = m.author_id
        WHERE m.workspace_id = ? AND m.kind = 'dm' AND m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?`,
    )
    .all(workspaceId, dmId, limit) as any[]
  res.json({ messages: rows.reverse() })
})

// ---- Uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
app.post('/api/workspaces/:workspaceId/uploads', requireAuth(db), upload.single('file'), (req, res) => {
  const userId = (req as any).user.id as string
  const workspaceId = req.params.workspaceId as string
  if (!requireWorkspaceMember(userId, workspaceId)) return res.status(403).json({ error: 'Access denied.' })
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Missing file.' })

  const id = newId('att')
  const wsDir = path.join(uploadsRoot, workspaceId)
  fs.mkdirSync(wsDir, { recursive: true })
  const safeName = file.originalname.replace(/[^\w.\-() ]+/g, '_').slice(0, 120)
  const rel = path.join(workspaceId, `${id}_${safeName}`)
  const abs = path.join(uploadsRoot, rel)
  fs.writeFileSync(abs, file.buffer)
  const now = Date.now()
  db.prepare('INSERT INTO attachments (id, workspace_id, uploader_id, mime, name, size, path, created_at) VALUES (?,?,?,?,?,?,?,?)').run(
    id,
    workspaceId,
    userId,
    file.mimetype,
    safeName,
    file.size,
    rel,
    now,
  )
  res.json({ attachment: { id, url: `/uploads/${rel.replace(/\\/g, '/')}`, name: safeName, size: file.size, mime: file.mimetype } })
})

// ---- Search (FTS)
app.get('/api/workspaces/:workspaceId/search', requireAuth(db), (req, res) => {
  const userId = (req as any).user.id as string
  const workspaceId = req.params.workspaceId as string
  const q = String(req.query.q || '').trim()
  if (!q) return res.json({ results: [] })
  if (!requireWorkspaceMember(userId, workspaceId)) return res.status(403).json({ error: 'Access denied.' })

  const results = db
    .prepare(
      `SELECT m.id as messageId, m.kind, m.conversation_id as conversationId, snippet(messages_fts, 4, '<mark>', '</mark>', '…', 12) as snippet
         FROM messages_fts
         JOIN messages m ON m.id = messages_fts.message_id
        WHERE messages_fts.workspace_id = ? AND messages_fts.markdown MATCH ?
        ORDER BY rank
        LIMIT 20`,
    )
    .all(workspaceId, q) as Array<{ messageId: string; kind: 'channel' | 'dm'; conversationId: string; snippet: string }>

  res.json({ results })
})

// ---- WebSocket
type ClientInfo = {
  userId: string
  email: string
  displayName: string
  workspaceId: string
}

const server = http.createServer(app)
const wss = new WebSocketServer({ noServer: true })

const workspaceClients = new Map<string, Set<any>>()
const presence = new Map<string, Map<string, { status: 'online' | 'away'; lastSeen: number }>>() // workspaceId -> userId -> status

server.on('upgrade', (req, socket, head) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    if (url.pathname !== '/api/ws') {
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, url)
    })
  } catch {
    socket.destroy()
  }
})

wss.on('connection', (ws: any, _req: import('http').IncomingMessage, url: URL) => {
  const token = url.searchParams.get('token') || ''
  const workspaceId = url.searchParams.get('workspaceId') || ''
  let info: ClientInfo | null = null
  try {
    const claims = verifyToken(token)
    const user = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(claims.sub) as
      | { id: string; email: string; display_name: string }
      | undefined
    if (!user) throw new Error('no user')
    const member = db
      .prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
      .get(workspaceId, user.id) as { role: string } | undefined
    if (!member) throw new Error('not member')
    info = { userId: user.id, email: user.email, displayName: user.display_name, workspaceId }
  } catch {
    ws.close()
    return
  }

  ws._canvas = info
  const set = workspaceClients.get(workspaceId) ?? new Set()
  set.add(ws)
  workspaceClients.set(workspaceId, set)

  // Presence online
  const wsPresence = presence.get(workspaceId) ?? new Map()
  wsPresence.set(info.userId, { status: 'online', lastSeen: Date.now() })
  presence.set(workspaceId, wsPresence)
  broadcast(workspaceId, { type: 'presence', userId: info.userId, status: 'online', at: Date.now() })

  ws.on('message', (raw: any) => {
    let msg: any
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }
    handle(ws, info!, msg)
  })

  ws.on('close', () => {
    set.delete(ws)
    if (!set.size) workspaceClients.delete(workspaceId)
    const cur = presence.get(workspaceId)
    cur?.delete(info!.userId)
    broadcast(workspaceId, { type: 'presence', userId: info!.userId, status: 'offline', at: Date.now() })
  })
})

function broadcast(workspaceId: string, payload: any) {
  const clients = workspaceClients.get(workspaceId)
  if (!clients) return
  const data = JSON.stringify(payload)
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(data)
  }
}

function handle(ws: any, info: ClientInfo, msg: any) {
  if (msg?.type === 'heartbeat') {
    const wsPresence = presence.get(info.workspaceId)
    const cur = wsPresence?.get(info.userId)
    if (cur) {
      cur.lastSeen = Date.now()
      cur.status = 'online'
    }
    return
  }

  if (msg?.type === 'typing') {
    broadcast(info.workspaceId, {
      type: 'typing',
      conversationId: msg.conversationId,
      userId: info.userId,
      displayName: info.displayName,
      isTyping: Boolean(msg.isTyping),
      at: Date.now(),
    })
    return
  }

  if (msg?.type === 'message.send') {
    const parsed = z
      .object({
        clientMsgId: z.string().min(5),
        kind: z.enum(['channel', 'dm']),
        conversationId: z.string().min(1),
        markdown: z.string().max(4000),
        attachments: z.array(z.object({ id: z.string() })).optional(),
      })
      .safeParse(msg)
    if (!parsed.success) {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid message.' }))
      return
    }

    const now = Date.now()
    const id = newId('msg')
    const { kind, conversationId } = parsed.data
    if (!requireWorkspaceMember(info.userId, info.workspaceId)) {
      ws.send(JSON.stringify({ type: 'error', error: 'Access denied.' }))
      return
    }

    // DM membership check
    if (kind === 'dm') {
      const dm = db
        .prepare('SELECT id FROM dms WHERE id = ? AND workspace_id = ? AND (user_a = ? OR user_b = ?)')
        .get(conversationId, info.workspaceId, info.userId, info.userId) as { id: string } | undefined
      if (!dm) {
        ws.send(JSON.stringify({ type: 'error', error: 'DM not found.' }))
        return
      }
    }

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO messages (id, workspace_id, kind, conversation_id, author_id, markdown, created_at, client_msg_id) VALUES (?,?,?,?,?,?,?,?)',
      ).run(id, info.workspaceId, kind, conversationId, info.userId, parsed.data.markdown, now, parsed.data.clientMsgId)

      const att = parsed.data.attachments ?? []
      for (const a of att) {
        const exists = db
          .prepare('SELECT id FROM attachments WHERE id = ? AND workspace_id = ? AND uploader_id = ?')
          .get(a.id, info.workspaceId, info.userId) as { id: string } | undefined
        if (exists) db.prepare('INSERT OR IGNORE INTO message_attachments (message_id, attachment_id) VALUES (?,?)').run(id, a.id)
      }
    })
    tx()

    const dto = db
      .prepare(
        `SELECT m.id, m.kind, m.conversation_id as conversationId, m.author_id as authorId,
                u.display_name as authorDisplayName,
                m.created_at as createdAt, m.edited_at as editedAt, m.deleted_at as deletedAt,
                m.markdown, m.client_msg_id as clientMsgId
           FROM messages m JOIN users u ON u.id = m.author_id
          WHERE m.id = ?`,
      )
      .get(id) as any

    // Ack only to sender, but broadcast message to everyone.
    ws.send(JSON.stringify({ type: 'ack', clientMsgId: parsed.data.clientMsgId, serverMsgId: id, at: now }))
    broadcast(info.workspaceId, { type: 'message.new', message: dto })
    return
  }
}

// ---- Serve frontend
const candidatePaths = [
  path.join(process.cwd(), 'apps', 'web', 'dist'),
  path.join(process.cwd(), '..', 'web', 'dist'),
]
const webDist = candidatePaths.find(p => fs.existsSync(p))
console.log('[canvas] cwd:', process.cwd())
console.log('[canvas] webDist resolved:', webDist ?? 'NOT FOUND')
if (webDist) {
  app.use(express.static(webDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'))
  })
} else {
  app.get('*', (_req, res) => {
    res.status(404).send('Frontend not found. Tried: ' + candidatePaths.join(', '))
  })
}

server.listen(PORT, () => {
  console.log(`[canvas] server listening on http://localhost:${PORT}`)
})

