import { create } from 'zustand'
import type { Channel, Dm, Workspace } from '../ui/shell/AppShell'

type NavState = {
  activeWorkspaceId: string | null
  channels: Channel[]
  dms: Dm[]
  setWorkspaceNav: (workspaceId: string, channels: Channel[], dms: Dm[]) => void
  clear: () => void
}

export const useNav = create<NavState>((set) => ({
  activeWorkspaceId: null,
  channels: [],
  dms: [],
  setWorkspaceNav: (workspaceId, channels, dms) => set({ activeWorkspaceId: workspaceId, channels, dms }),
  clear: () => set({ activeWorkspaceId: null, channels: [], dms: [] }),
}))

