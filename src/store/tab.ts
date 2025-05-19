import { create } from 'zustand'

interface RightNavTabStore {
  rightNavTab: string | null
  setRightNavTab: (tab: string | null) => void
}

export const useRightNavTabStore = create<RightNavTabStore>((set) => ({
  rightNavTab: null,
  setRightNavTab: (rightNavTab) => set(() => ({ rightNavTab })),
}))
