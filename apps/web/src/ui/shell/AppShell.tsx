import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../state/auth'
import { useNav } from '../../state/nav'
import { LeftSidebar } from './LeftSidebar'
import { ChatView } from './ChatView'
import { WorkspacePicker } from './WorkspacePicker'
import { RightPanel } from './RightPanel'

export type Workspace = { id: string; name: string; role: 'admin' | 'member' }
export type Channel = { id: string; name: string; isPrivate: 0 | 1; unreadCount: number }
export type Dm = { id: string; otherUserId: string; otherDisplayName: string; unreadCount: number }

export function AppShell() {
  const logout = useAuth((s) => s.logout)
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api<{ workspaces: Workspace[] }>('/api/workspaces'),
  })

  // Keep the app responsive: left sidebar is a slide-over on mobile.
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <div className="h-full bg-canvas-bg text-white">
      <div className="flex h-full">
        <LeftSidebar
          workspaces={workspaces?.workspaces ?? null}
          mobileOpen={mobileNavOpen}
          onMobileClose={closeMobileNav}
          onLogout={logout}
        />

        <div className="min-w-0 flex-1">
          <Routes>
            <Route path="/" element={<WorkspacePicker workspaces={workspaces?.workspaces ?? null} />} />
            <Route path="w/:workspaceId/*" element={<WorkspaceRoutes onOpenMobileNav={() => setMobileNavOpen(true)} />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </div>

        <RightPanel />
      </div>
    </div>
  )
}

function WorkspaceRoutes({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { workspaceId } = useParams()
  const nav = useNavigate()
  const id = workspaceId!
  const setWorkspaceNav = useNav((s) => s.setWorkspaceNav)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['workspace', id, 'nav'],
    queryFn: () => api<{ channels: Channel[]; dms: Dm[] }>('/api/workspaces/' + id + '/nav'),
  })

  useEffect(() => {
    if (isError) return
  }, [isError])

  const channels = useMemo(() => data?.channels ?? [], [data])
  const dms = useMemo(() => data?.dms ?? [], [data])

  useEffect(() => {
    if (!isLoading && !isError) setWorkspaceNav(id, channels, dms)
  }, [channels, dms, id, isError, isLoading, setWorkspaceNav])

  return (
    <ChatView
      workspaceId={id}
      channels={channels}
      dms={dms}
      isNavLoading={isLoading}
      isNavError={isError}
      onRetryNav={() => void refetch()}
      onOpenMobileNav={onOpenMobileNav}
      onNavigate={(to) => nav(to)}
    />
  )
}

