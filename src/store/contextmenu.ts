import { create } from 'zustand'

interface ContextMenuOpenState {
  isContextOpen: boolean
  setIsContextOpen: (updater: boolean | ((prev: boolean) => boolean)) => void
}

export const useContextMenuOpenStore = create<ContextMenuOpenState>((set) => ({
  isContextOpen: false,
  setIsContextOpen: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isContextOpen: updater(prev.isContextOpen) }
        : { isContextOpen: updater },
    ),
}))
