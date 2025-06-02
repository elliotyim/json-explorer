import { create } from 'zustand'

interface InitialFocusState {
  isAppReady: boolean
  setIsAppReady: (updater: boolean | ((prev: boolean) => boolean)) => void
}

export const useInitialFocus = create<InitialFocusState>((set) => ({
  isAppReady: false,
  setIsAppReady: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isAppReady: updater(prev.isAppReady) }
        : { isAppReady: updater },
    ),
}))
