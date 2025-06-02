import { create } from 'zustand'

interface SearchTriggerState {
  isSearchTriggered: boolean
  setIsSearchTriggered: (
    updater: boolean | ((prev: boolean) => boolean),
  ) => void
}

export const useSearchTriggerStore = create<SearchTriggerState>((set) => ({
  isSearchTriggered: false,
  setIsSearchTriggered: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isSearchTriggered: updater(prev.isSearchTriggered) }
        : { isSearchTriggered: updater },
    ),
}))
