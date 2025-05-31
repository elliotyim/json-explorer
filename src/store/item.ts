import { create } from 'zustand'

interface CurrentItemState {
  currentItem: CurrentItem
  setCurrentItem: (
    currentItem: CurrentItem | ((prev: CurrentItem) => CurrentItem),
  ) => void
}

interface FocusedItemState {
  focusedItemId: string | null
  setFocusedItemId: (
    updater: string | null | ((prev: string | null) => string | null),
  ) => void
}

interface DraggingItemState {
  draggingItemId: string | null
  setDraggingItemId: (
    updater: string | null | ((prev: string | null) => string | null),
  ) => void
}

interface DisplayItemsState {
  displayItems: Data[]
  setDisplayItems: (updater: Data[] | ((prev: Data[]) => Data[])) => void
}

interface ItemAreaState {
  itemAreas: Record<string, DOMRect>
  setItemAreas: (
    updater:
      | Record<string, DOMRect>
      | ((prev: Record<string, DOMRect>) => Record<string, DOMRect>),
  ) => void
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
  currentItem: { id: '', data: {} },
  setCurrentItem: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { currentItem: updater(prev.currentItem) }
        : { currentItem: updater },
    ),
}))

export const useFocusedItem = create<FocusedItemState>((set) => ({
  focusedItemId: null,
  setFocusedItemId: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { focusedItemId: updater(prev.focusedItemId) }
        : { focusedItemId: updater },
    ),
}))

export const useDraggingItemStore = create<DraggingItemState>((set) => ({
  draggingItemId: null,
  setDraggingItemId: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { draggingItemId: updater(prev.draggingItemId) }
        : { draggingItemId: updater },
    ),
}))

export const useDisplayItemsStore = create<DisplayItemsState>((set) => ({
  displayItems: [],
  setDisplayItems: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { displayItems: updater(prev.displayItems) }
        : { displayItems: updater },
    ),
}))

export const useItemAreaStore = create<ItemAreaState>((set) => ({
  itemAreas: {},
  setItemAreas: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { itemAreas: updater(prev.itemAreas) }
        : { itemAreas: updater },
    ),
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
