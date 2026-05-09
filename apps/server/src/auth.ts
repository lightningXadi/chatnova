import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import type { Request, Response, NextFunction } from 'express'
import type { DB } from './db.js'

const JWT_SECRET = process.env.CANVAS_JWT_SECRET || 'dev-secret-change-me'
const JWT_ISSUER = 'canvas'

export type JwtClaims = { sub: string; email: string }

export function signToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email } satisfies JwtClaims, JWT_SECRET, {
    issuer: JWT_ISSUER,
    expiresIn: '14d',
  })
}

export function verifyToken(token: string): JwtClaims {
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as JwtClaims
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function newId(prefix: string) {
  return `${prefix}_${nanoid(12)}`
}

export type AuthedRequest = Request & { user?: { id: string; email: string } }

export function requireAuth(db: DB) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || ''
    const m = header.match(/^Bearer\s+(.+)$/i)
    if (!m) return res.status(401).json({ error: 'Not signed in.' })
    try {
      const claims = verifyToken(m[1]!)
      const user = db
        .prepare('SELECT id, email FROM users WHERE id = ?')
        .get(claims.sub) as { id: string; email: string } | undefined
      if (!user) return res.status(401).json({ error: 'Session expired.' })
      req.user = user
      next()
    } catch {
      return res.status(401).json({ error: 'Session expired.' })
    }
  }
}

