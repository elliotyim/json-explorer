import { create } from 'zustand'

interface InitialFocusState {
  isFocusDone: boolean
  setIsFocusDone: (updater: boolean | ((prev: boolean) => boolean)) => void
}

export const useInitialFocus = create<InitialFocusState>((set) => ({
  isFocusDone: false,
  setIsFocusDone: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isFocusDone: updater(prev.isFocusDone) }
        : { isFocusDone: updater },
    ),
}))
