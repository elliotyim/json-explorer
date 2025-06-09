import { TreeApi } from 'react-arborist'
import { create } from 'zustand'

interface TreeRefState {
  treeRef: React.RefObject<TreeApi<Data> | null>
  setTreeRef: (treeRef: React.RefObject<TreeApi<Data> | null>) => void
}

export const useTreeRefStore = create<TreeRefState>((set) => ({
  treeRef: { current: null },
  setTreeRef: (treeRef) => set(() => ({ treeRef })),
}))
