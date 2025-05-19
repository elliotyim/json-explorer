import { create } from 'zustand'

interface BackHistoryState {
  backHistories: string[]
  setBackHistories: (
    backHistories: string[] | ((prev: string[]) => string[]),
  ) => void
}

interface ForwardHistoryState {
  forwardHistories: string[]
  setForwardHistories: (
    forwardHistories: string[] | ((prev: string[]) => string[]),
  ) => void
}

export const useBackHistoryStore = create<BackHistoryState>((set) => ({
  backHistories: [],
  setBackHistories: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { backHistories: updater(prev.backHistories) }
        : { backHistories: updater },
    ),
}))

export const useForwardHistoryStore = create<ForwardHistoryState>((set) => ({
  forwardHistories: [],
  setForwardHistories: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { forwardHistories: updater(prev.forwardHistories) }
        : { forwardHistories: updater },
    ),
}))
