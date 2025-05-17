import { NodeModel } from '@minoru/react-dnd-treeview'
import { create } from 'zustand'

interface CurrentItemState {
  currentItem: NodeModel<CustomData> | null
  setCurrentItem: (currentItem: NodeModel<CustomData> | null) => void
}

interface SelectedItemIdsState {
  selectedItemIds: Record<string, boolean>
  setSelectedItemIds: (
    selectedItemIds:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void
}

interface ExtraItemIdsState {
  extraItemIds: Record<string, boolean>
  setExtraItemIds: (
    extraItemIds:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void
}

interface ItemEditState {
  isItemEditing: boolean
  setIsItemEditing: (isOnModification: boolean) => void
}

export const useCurrentItemStore = create<CurrentItemState>((set) => ({
  currentItem: null,
  setCurrentItem: (currentItem) => set(() => ({ currentItem })),
}))

export const useSelectedItemIdsStore = create<SelectedItemIdsState>((set) => ({
  selectedItemIds: {},
  setSelectedItemIds: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { selectedItemIds: updater(prev.selectedItemIds) }
        : { selectedItemIds: updater },
    ),
}))

export const useExtraItemIdsStore = create<ExtraItemIdsState>((set) => ({
  extraItemIds: {},
  setExtraItemIds: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { extraItemIds: updater(prev.extraItemIds) }
        : { extraItemIds: updater },
    ),
}))

export const useItemEditingStore = create<ItemEditState>((set) => ({
  isItemEditing: false,
  setIsItemEditing: (isItemEditing) => set(() => ({ isItemEditing })),
}))
