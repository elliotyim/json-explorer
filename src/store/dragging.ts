import { create } from 'zustand'

interface AreaDraggingState {
  isAreaDragging: boolean
  setIsAreaDragging: (updater: boolean | ((prev: boolean) => boolean)) => void
}

export const useAreaDraggingStore = create<AreaDraggingState>((set) => ({
  isAreaDragging: false,
  setIsAreaDragging: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isAreaDragging: updater(prev.isAreaDragging) }
        : { isAreaDragging: updater },
    ),
}))
