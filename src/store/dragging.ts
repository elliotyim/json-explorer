import { create } from 'zustand'

interface AreaDraggingState {
  isAreaDraggingRef: React.RefObject<boolean>
  setIsAreaDragging: (isAreaDraggingRef: React.RefObject<boolean>) => void
}

export const useAreaDraggingStore = create<AreaDraggingState>((set) => ({
  isAreaDraggingRef: { current: false },
  setIsAreaDragging: (isAreaDraggingRef) => set(() => ({ isAreaDraggingRef })),
}))
