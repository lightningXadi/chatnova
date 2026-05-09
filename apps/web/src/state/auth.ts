import { create } from 'zustand'
import { api, setToken } from '../lib/api'

export type Me = {
  id: string
  email: string
  displayName: string
}

type AuthState = {
  token: string | null
  me: Me | null
  status: 'unknown' | 'signed_out' | 'signed_in'
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('canvas_token'),
  me: null,
  status: 'unknown',
  hydrate: async () => {
    const token = localStorage.getItem('canvas_token')
    if (!token) {
      set({ token: null, me: null, status: 'signed_out' })
      return
    }
    try {
      const me = await api<Me>('/api/me')
      set({ token, me, status: 'signed_in' })
    } catch {
      setToken(null)
      set({ token: null, me: null, status: 'signed_out' })
    }
  },
  login: async (email, password) => {
    const out = await api<{ token: string; me: Me }>('/api/auth/login', {
      method: 'POST',
      json: { email, password },
    })
    setToken(out.token)
    set({ token: out.token, me: out.me, status: 'signed_in' })
  },
  signup: async (email, password, displayName) => {
    const out = await api<{ token: string; me: Me }>('/api/auth/signup', {
      method: 'POST',
      json: { email, password, displayName },
    })
    setToken(out.token)
    set({ token: out.token, me: out.me, status: 'signed_in' })
  },
  logout: () => {
    setToken(null)
    set({ token: null, me: null, status: 'signed_out' })
  },
}))

