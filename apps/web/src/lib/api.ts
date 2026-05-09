export type ApiError = {
  error: string
  code?: string
}

function getToken() {
  return localStorage.getItem('canvas_token')
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('canvas_token')
  else localStorage.setItem('canvas_token', token)
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.json !== undefined) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = (isJson ? await res.json() : await res.text()) as unknown

  if (!res.ok) {
    const err =
      typeof data === 'object' && data && 'error' in data
        ? (data as ApiError)
        : ({ error: res.statusText } as ApiError)
    throw Object.assign(new Error(err.error), { status: res.status, ...err })
  }

  return data as T
}

