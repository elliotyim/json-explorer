import { CopyItemCommand } from '@/commands/item/CopyItemCommand'
import { CutItemCommand } from '@/commands/item/CutItemCommand'
import { DeleteItemCommand } from '@/commands/item/DeleteItemCommand'
import { PasteItemCommand } from '@/commands/item/PasteItemCommand'
import { ITEM } from '@/constants/item'
import { TAB } from '@/constants/tab'
import { useCommandStore } from '@/store/command'
import {
  useMainContainerStore,
  useScrollContainerStore,
} from '@/store/container'
import { useAreaDraggingStore } from '@/store/dragging'
import {
  useCurrentItemStore,
  useDisplayItemsStore,
  useItemAreaStore,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'
import { MathUtil } from '@/utils/math'
import {
  RefObject,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useItemAction } from './useItemAction'
import { useHistory } from './useHistory'

interface ReturnProps {
  pushedKeysRef: RefObject<Record<string, boolean>>
  focusedItemRef: RefObject<string | null>
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void
  undoAction: (e: React.KeyboardEvent<HTMLElement>) => Promise<void>
  redoAction: (e: React.KeyboardEvent<HTMLElement>) => Promise<void>
  selectAction: (e: React.KeyboardEvent<HTMLElement>) => void
  selectAllAction: (e: React.KeyboardEvent<HTMLElement>) => void
  cancelSelectionAtion: (e: React.KeyboardEvent<HTMLElement>) => void
  enterAction: (e: React.KeyboardEvent<HTMLElement>) => void
  goBackwardAction: (e: React.KeyboardEvent<HTMLElement>) => void
  contextMenuAction: (e: React.KeyboardEvent<HTMLElement>) => void
  copyItemAction: (e: React.KeyboardEvent<HTMLElement>) => Promise<void>
  pastItemAction: (e: React.KeyboardEvent<HTMLElement>) => Promise<void>
  cutItemAction: (e: React.KeyboardEvent<HTMLElement>) => Promise<void>
  deleteItemAction: (e: React.KeyboardEvent<HTMLElement>) => Promise<void>
}

export const useKeyboardAction = (): ReturnProps => {
  const pushedKeysRef = useRef<Record<string, boolean>>({})
  const focusedItemRef = useRef<string | null>(null)

  const [itemIndex, setItemIndex] = useState<number>(-1)
  const [containerRect, setContainerRect] = useState<DOMRect>(new DOMRect())

  const { json, setJson } = useJsonStore()
  const { currentItem } = useCurrentItemStore()
  const { displayItems } = useDisplayItemsStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { goBackward } = useHistory()
  const { itemAreas } = useItemAreaStore()
  const { execute, redo, undo } = useCommandStore()
  const { isAreaDragging } = useAreaDraggingStore()
  const { enterItem } = useItemAction()

  const { container } = useMainContainerStore()
  const { scrollContainer } = useScrollContainerStore()

  const ids = Object.keys(selectedItemIds)

  const controlPressed = (e: React.KeyboardEvent) => e.ctrlKey || e.metaKey

  const getItemIndex = useCallback(
    (id: string): number => {
      for (const i in displayItems) {
        if (displayItems[i].id === id) return +i
      }
      return -1
    },
    [displayItems],
  )

  const select = (itemIds: string[], multi: boolean = false) => {
    if (itemIds.length) {
      const newItem: Record<string, boolean> = {}
      itemIds.forEach((item) => {
        newItem[item] = true
      })
      if (!multi) setSelectedItemIds(newItem)
      else setSelectedItemIds((prev) => ({ ...prev, ...newItem }))
    }
  }

  const clearSelect = () => {
    setSelectedItemIds({})
    setItemIndex(-1)
    focusedItemRef.current = null
  }

  const scrollIntoView = useCallback(
    (y: number, height: number) => {
      if (!scrollContainer) return
      const handle = requestAnimationFrame(() => {
        const currentHeight = containerRect.height + scrollContainer.scrollTop

        if (currentHeight < y + height) {
          const top = Math.abs(
            containerRect.height - (y + height + ITEM.GAP_SIZE),
          )
          scrollContainer.scrollTo({ top })
        } else if (scrollContainer.scrollTop > y) {
          const top = y - ITEM.GAP_SIZE
          scrollContainer.scrollTo({ top })
        }
        cancelAnimationFrame(handle)
      })
    },
    [containerRect.height, scrollContainer],
  )

  const arrowKeyAction = (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft'
    ) {
      e.preventDefault()

      if (!container || !scrollContainer) {
        throw Error('Containers are not loaded!')
      }

      const selected =
        focusedItemRef.current != null ? [focusedItemRef.current] : []

      const containerWidth = container.getBoundingClientRect().width
      const columnOffset = MathUtil.countColumn(containerWidth)

      let nextIndex = itemIndex
      let nextItemId = ''

      const current = nextIndex % columnOffset
      if (e.key === 'ArrowUp') {
        nextIndex = Math.max(0, nextIndex - columnOffset)
      } else if (e.key === 'ArrowRight') {
        const next = ((nextIndex + 1) % displayItems.length) % columnOffset
        if (current < next) nextIndex += 1
      } else if (e.key === 'ArrowDown') {
        nextIndex = Math.min(nextIndex + columnOffset, displayItems.length - 1)
      } else if (e.key === 'ArrowLeft') {
        const next = Math.abs(nextIndex - 1) % columnOffset
        if (current > next) nextIndex -= 1
      }

      nextItemId = displayItems[nextIndex].id

      if (nextIndex > -1 && nextItemId) {
        startTransition(() => {
          setItemIndex(nextIndex)
          focusedItemRef.current = nextItemId
        })
      }

      selected.push(nextItemId)

      if (e.shiftKey) select(selected, true)
      return true
    }
    return false
  }

  const undoAction = async (e: React.KeyboardEvent<HTMLElement>) => {
    if (controlPressed(e) && e.key === 'z') {
      e.preventDefault()
      const result = await undo()
      if (result) setJson(result)
    }
  }

  const redoAction = async (e: React.KeyboardEvent<HTMLElement>) => {
    if (controlPressed(e) && (e.key === 'y' || e.key === 'Z')) {
      e.preventDefault()
      const result = await redo()
      if (result) setJson(result)
    }
  }

  const selectAction = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === ' ' && focusedItemRef.current != null) {
      e.preventDefault()
      const selected = [focusedItemRef.current]
      let multi = false

      if (e.ctrlKey || e.metaKey) {
        if (selectedItemIds[focusedItemRef.current]) {
          selected.pop()
          const newSelectedItemIds = structuredClone(selectedItemIds)
          delete newSelectedItemIds[focusedItemRef.current]
          selected.push(...Object.keys(newSelectedItemIds))
        } else {
          multi = true
        }
      }

      select([...selected], multi)
    }
  }

  const selectAllAction = (e: React.KeyboardEvent<HTMLElement>) => {
    if (controlPressed(e) && e.key === 'a') {
      e.preventDefault()
      e.stopPropagation()
      const ids = Object.keys(selectedItemIds)
      if (ids.length !== displayItems.length) {
        const allSelectedItems: Record<string, boolean> = {}
        displayItems.forEach((item) => (allSelectedItems[item.id] = true))
        setSelectedItemIds(allSelectedItems)
      }
    }
  }

  const cancelSelectionAtion = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setSelectedItemIds({})

      if (
        document.activeElement?.getAttribute('tabindex') === '-1' &&
        document.activeElement !== container
      ) {
        ;(document.activeElement as HTMLElement).blur()
      }
    }
  }

  const enterAction = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      if (focusedItemRef.current != null) {
        const type = JSONUtil.getItemType(json, focusedItemRef.current)
        if (type === 'value') {
          setSelectedItemIds({ [focusedItemRef.current]: true })
          setRightNavTab(TAB.PROPERTIES)
        } else {
          enterItem(focusedItemRef.current)
          clearSelect()
        }
      }
    }
  }

  const goBackwardAction = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Backspace') {
      goBackward()
      clearSelect()
    }
  }

  const contextMenuAction = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ContextMenu') {
      if (
        focusedItemRef.current != null &&
        !selectedItemIds[focusedItemRef.current]
      ) {
        setSelectedItemIds((prev) => ({
          ...prev,
          [focusedItemRef.current!]: true,
        }))
      }
    }
  }

  const copyItemAction = async (e: React.KeyboardEvent<HTMLElement>) => {
    if (controlPressed(e) && e.key === 'c' && ids.length) {
      const command = new CopyItemCommand(structuredClone(json), { ids })
      await execute(command)
    }
  }

  const cutItemAction = async (e: React.KeyboardEvent<HTMLElement>) => {
    if (controlPressed(e) && e.key === 'x' && ids.length) {
      const command = new CutItemCommand(structuredClone(json), { ids })
      const result = await execute(command)
      setJson(result)
      clearSelect()
    }
  }

  const pastItemAction = async (e: React.KeyboardEvent<HTMLElement>) => {
    const itemInClipboard = sessionStorage.getItem('copyPaste')
    if (controlPressed(e) && e.key === 'v' && itemInClipboard) {
      const command = new PasteItemCommand(structuredClone(json), {
        currentItemId: currentItem.id,
      })
      const result = await execute(command)
      setJson(result)
    }
  }

  const deleteItemAction = async (e: React.KeyboardEvent<HTMLElement>) => {
    if (
      ((controlPressed(e) && e.key === 'd') || e.key === 'Delete') &&
      ids.length
    ) {
      e.preventDefault()
      const command = new DeleteItemCommand(structuredClone(json), { ids })
      const result = await execute(command)
      setJson(result)
      clearSelect()
    }
  }

  const onKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!pushedKeysRef.current[e.key]) pushedKeysRef.current[e.key] = true

    const moved = arrowKeyAction(e)
    if (moved) return

    await undoAction(e)
    await redoAction(e)
    selectAction(e)
    selectAllAction(e)
    cancelSelectionAtion(e)
    enterAction(e)
    goBackwardAction(e)
    contextMenuAction(e)
    await copyItemAction(e)
    await pastItemAction(e)
    await cutItemAction(e)
    await deleteItemAction(e)
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    delete pushedKeysRef.current[e.key]
  }

  useEffect(() => {
    if (!container || !scrollContainer) return
    setContainerRect(container.getBoundingClientRect())
  }, [container, scrollContainer])

  useEffect(() => {
    const itemIds = Object.keys(selectedItemIds)
    if (itemIds.length === 1 && !isAreaDragging) {
      const id = itemIds[0]
      focusedItemRef.current = id
      setItemIndex(getItemIndex(id))
    }
  }, [getItemIndex, isAreaDragging, selectedItemIds])

  useEffect(() => {
    if (focusedItemRef.current == null || !scrollContainer) return

    const itemArea = itemAreas[focusedItemRef.current]
    if (!itemArea) return

    const { y, height } = itemArea
    const currentHeight = containerRect.height + scrollContainer.scrollTop

    if (
      (currentHeight && currentHeight < y + height) ||
      scrollContainer.scrollTop > y
    ) {
      scrollIntoView(y, height)
    }
  }, [itemIndex, itemAreas, containerRect, scrollContainer, scrollIntoView])

  return {
    pushedKeysRef,
    focusedItemRef,
    onKeyDown,
    onKeyUp,
    undoAction,
    redoAction,
    selectAction,
    selectAllAction,
    cancelSelectionAtion,
    enterAction,
    goBackwardAction,
    contextMenuAction,
    copyItemAction,
    pastItemAction,
    cutItemAction,
    deleteItemAction,
  }
}
