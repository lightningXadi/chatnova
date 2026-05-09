import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Workspace } from './AppShell'
import { Plus, ArrowRight, Link2, Copy, Check, Users } from 'lucide-react'

export function WorkspacePicker({ workspaces }: { workspaces: Workspace[] | null }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')

  const urlParams = new URLSearchParams(window.location.search)
  const inviteToken = urlParams.get('invite')

  const create = useMutation({
    mutationFn: (name: string) =>
      api<{ workspace: Workspace; defaultChannelId: string }>('/api/workspaces', {
        method: 'POST',
        json: { name },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const isLoading = workspaces === null

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#090b10' }}>
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 70% 20%, rgba(56,189,248,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 30% 80%, rgba(192,132,252,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-[860px] px-6 py-10">
        {/* Header */}
        <div className="animate-fade-up mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div
              style={{
                height: 36,
                width: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: 'white',
                fontFamily: '"Syne", sans-serif',
              }}
            >
              CN
            </div>
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
              ChatNova
            </span>
          </div>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
            Your Spaces
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Choose a space to open channels and direct messages.</p>
        </div>

        {inviteToken && (
          <InviteBanner token={inviteToken} onJoined={() => qc.invalidateQueries({ queryKey: ['workspaces'] })} />
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Create Space card */}
          <div
            className="animate-fade-up stagger-1 rounded-2xl p-6"
            style={{
              background: '#111520',
              border: '1px solid #1e2535',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(56,189,248,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Plus size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Create a space</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Invite teammates and get started.</div>
              </div>
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const n = name.trim()
                if (!n) return
                create.mutate(n)
                setName('')
              }}
            >
              <input
                style={{
                  flex: 1,
                  borderRadius: 10,
                  border: '1px solid #1e2535',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'white',
                  outline: 'none',
                }}
                placeholder="e.g. Acme Studio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={40}
                required
                aria-label="Space name"
              />
              <button
                style={{
                  borderRadius: 10,
                  background: create.isPending ? 'rgba(56,189,248,0.4)' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'white',
                  border: 'none',
                  cursor: create.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
                disabled={create.isPending}
                type="submit"
              >
                {create.isPending ? '…' : 'Create'}
              </button>
            </form>

            {create.error ? (
              <div
                className="mt-3 rounded-xl border px-4 py-2.5 text-sm"
                style={{ borderColor: 'rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', color: '#fca5a5' }}
              >
                {create.error instanceof Error ? create.error.message : 'Unable to create space.'}
              </div>
            ) : null}
          </div>

          {/* Your spaces */}
          <div
            className="animate-fade-up stagger-2 rounded-2xl p-6"
            style={{
              background: '#111520',
              border: '1px solid #1e2535',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(129,140,248,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Your spaces</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Pick one to open channels.</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isLoading ? (
                <div style={{ fontSize: 13, color: '#64748b' }}>Loading…</div>
              ) : workspaces.length ? (
                workspaces.map((w) => <SpaceItem key={w.id} workspace={w} />)
              ) : (
                <EmptySpaces />
              )}
            </div>
          </div>
        </div>

        {/* Join by invite */}
        <div
          className="animate-fade-up stagger-3 mt-5 rounded-2xl p-6"
          style={{ background: '#111520', border: '1px solid #1e2535' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(52,211,153,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Link2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Join a space</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Paste an invite link to join.</div>
            </div>
          </div>
          <JoinByLink onJoined={() => qc.invalidateQueries({ queryKey: ['workspaces'] })} />
        </div>
      </div>
    </div>
  )
}

function SpaceItem({ workspace }: { workspace: Workspace }) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateInvite = useMutation({
    mutationFn: () =>
      api<{ token: string }>(`/api/workspaces/${workspace.id}/invites`, { method: 'POST' }),
    onSuccess: (data) => {
      const url = `${window.location.origin}/app?invite=${data.token}`
      setInviteUrl(url)
      setShowInvite(true)
    },
  })

  const copyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid #1e2535',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
        <a href={`/app/w/${workspace.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workspace.name}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>
            {workspace.role}
          </div>
        </a>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => generateInvite.mutate()}
            style={{
              borderRadius: 8,
              border: '1px solid #1e2535',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 500,
              color: '#64748b',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {generateInvite.isPending ? '…' : 'Invite'}
          </button>
          <a
            href={`/app/w/${workspace.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 8,
              background: 'rgba(56,189,248,0.1)',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#38bdf8',
              textDecoration: 'none',
            }}
          >
            Open <ArrowRight size={11} />
          </a>
        </div>
      </div>

      {showInvite && inviteUrl && (
        <div style={{ borderTop: '1px solid #1e2535', padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Share link — expires in 7 days:</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              readOnly
              value={inviteUrl}
              style={{
                flex: 1,
                borderRadius: 8,
                border: '1px solid #1e2535',
                background: 'rgba(255,255,255,0.03)',
                padding: '5px 10px',
                fontSize: 11,
                color: '#94a3b8',
                outline: 'none',
              }}
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={copyLink}
              style={{
                borderRadius: 8,
                background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.1)',
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: copied ? '#34d399' : '#38bdf8',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InviteBanner({ token, onJoined }: { token: string; onJoined: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => api<{ workspaceId: string; workspaceName: string }>(`/api/invites/${token}`),
  })

  const join = useMutation({
    mutationFn: () => api<{ workspaceId: string }>(`/api/invites/${token}/join`, { method: 'POST' }),
    onSuccess: (data) => {
      onJoined()
      window.location.href = `/app/w/${data.workspaceId}`
    },
  })

  if (isLoading) return (
    <div className="mb-5 rounded-2xl border p-4 text-sm" style={{ borderColor: 'rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.06)', color: '#94a3b8' }}>
      Checking invite…
    </div>
  )

  if (error || !data) return (
    <div className="mb-5 rounded-2xl border p-4 text-sm" style={{ borderColor: 'rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', color: '#fca5a5' }}>
      This invite link is invalid or has expired.
    </div>
  )

  return (
    <div className="mb-5 rounded-2xl border p-5" style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.06)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>You've been invited!</div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
        Join <strong style={{ color: '#f1f5f9' }}>{data.workspaceName}</strong> to start chatting.
      </div>
      <button
        onClick={() => join.mutate()}
        disabled={join.isPending}
        style={{
          marginTop: 12,
          borderRadius: 10,
          background: join.isPending ? 'rgba(56,189,248,0.4)' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: 'white',
          border: 'none',
          cursor: join.isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {join.isPending ? 'Joining…' : `Join ${data.workspaceName}`}
      </button>
    </div>
  )
}

function JoinByLink({ onJoined }: { onJoined: () => void }) {
  const [link, setLink] = useState('')

  const extractToken = (input: string) => {
    try {
      const url = new URL(input)
      return url.searchParams.get('invite') || input.trim()
    } catch {
      return input.trim()
    }
  }

  const join = useMutation({
    mutationFn: (token: string) =>
      api<{ workspaceId: string }>(`/api/invites/${token}/join`, { method: 'POST' }),
    onSuccess: (data) => {
      onJoined()
      window.location.href = `/app/w/${data.workspaceId}`
    },
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{
            flex: 1,
            borderRadius: 10,
            border: '1px solid #1e2535',
            background: 'rgba(255,255,255,0.04)',
            padding: '8px 12px',
            fontSize: 13,
            color: 'white',
            outline: 'none',
          }}
          placeholder="Paste invite link here…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button
          onClick={() => {
            const token = extractToken(link)
            if (token) join.mutate(token)
          }}
          disabled={!link.trim() || join.isPending}
          style={{
            borderRadius: 10,
            background: !link.trim() || join.isPending ? 'rgba(56,189,248,0.3)' : 'rgba(56,189,248,0.15)',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#38bdf8',
            border: '1px solid rgba(56,189,248,0.2)',
            cursor: !link.trim() || join.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {join.isPending ? 'Joining…' : 'Join'}
        </button>
      </div>
      {join.error && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#f87171' }}>
          {join.error instanceof Error ? join.error.message : 'Could not join space.'}
        </div>
      )}
    </div>
  )
}

function EmptySpaces() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px dashed #1e2535',
        padding: '20px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>No spaces yet</div>
      <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
        Create one to start conversations.
      </div>
    </div>
  )
}
