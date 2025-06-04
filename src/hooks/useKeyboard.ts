import { ITEM } from '@/constants/item'
import { TAB } from '@/constants/tab'
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
import { useHistory } from './useHistory'

interface Props {
  containerWidth: number
  isReady: boolean
  containerRef: React.RefObject<HTMLDivElement | null> | null
  scrollRef?: React.RefObject<HTMLDivElement | null> | null
  onItemEnter?: (itemId: string) => void
}

interface ReturnProps {
  focusedItemIdRef: RefObject<string | null>
  pushedKeysRef: RefObject<Record<string, boolean>>
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

export const useKeyboardAction = ({
  isReady,
  containerRef,
  scrollRef,
  containerWidth,
  onItemEnter,
}: Props): ReturnProps => {
  const focusedItemIdRef = useRef<string>(null)
  const pushedKeysRef = useRef<Record<string, boolean>>({})

  const [itemIndex, setItemIndex] = useState<number>(-1)
  const [containerRect, setContainerRect] = useState<DOMRect>(new DOMRect())

  const { json, setJson } = useJsonStore()
  const { currentItem } = useCurrentItemStore()
  const { displayItems } = useDisplayItemsStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { goBackward } = useHistory()
  const { itemAreas } = useItemAreaStore()

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
    focusedItemIdRef.current = null
  }

  const scrollIntoView = useCallback(
    (y: number, height: number) => {
      if (!scrollRef?.current) return
      const scrollContainer = scrollRef.current

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
    [containerRect.height, scrollRef],
  )

  const handleArrowKeys = (e: React.KeyboardEvent<HTMLDivElement>): number => {
    e.preventDefault()

    const columnOffset = MathUtil.countColumn(containerWidth)

    let nextIndex = itemIndex
    let nextItemId = ''

    const current = nextIndex % columnOffset
    if (e.key === 'ArrowUp') {
      nextIndex = Math.max(0, nextIndex - columnOffset)
      nextItemId = displayItems[nextIndex].id
    } else if (e.key === 'ArrowRight') {
      const next = ((nextIndex + 1) % displayItems.length) % columnOffset
      if (current < next) nextIndex += 1
      nextItemId = displayItems[nextIndex].id
    } else if (e.key === 'ArrowDown') {
      nextIndex = Math.min(nextIndex + columnOffset, displayItems.length - 1)
      nextItemId = displayItems[nextIndex].id
    } else if (e.key === 'ArrowLeft') {
      const next = Math.abs(nextIndex - 1) % columnOffset
      if (current > next) nextIndex -= 1
      nextItemId = displayItems[nextIndex].id
    }

    if (itemIndex === nextIndex) return nextIndex

    if (nextIndex > -1 && nextItemId) {
      startTransition(() => {
        setItemIndex(nextIndex)
        focusedItemIdRef.current = nextItemId
      })
    }
    return nextIndex
  }

  const handleFunctionKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'v' && sessionStorage.getItem('copyPaste')) {
      const result = JSONUtil.pastItems(json, currentItem.id)
      setJson(result)
      return
    }

    const itemIds = Object.keys(selectedItemIds)
    if (e.key === 'a') {
      e.preventDefault()
      if (itemIds.length !== displayItems.length) {
        const allSelectedItems: Record<string, boolean> = {}
        displayItems.forEach((item) => (allSelectedItems[item.id] = true))
        setSelectedItemIds(allSelectedItems)
      }
      return
    }

    if (!itemIds.length) return

    if (e.key === 'c') {
      JSONUtil.copyItems(json, Object.keys(selectedItemIds))
      return
    }

    if (e.key === 'x') {
      const result = JSONUtil.cutItems(json, itemIds)
      setJson(result)
      clearSelect()
      return
    }

    if (e.key === 'd') {
      e.preventDefault()
      const result = JSONUtil.deleteItems(json, itemIds)
      setJson(result)
      clearSelect()
      return
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!pushedKeysRef.current[e.key]) pushedKeysRef.current[e.key] = true

    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft'
    ) {
      if (!scrollRef?.current) return

      const selected =
        focusedItemIdRef.current != null ? [focusedItemIdRef.current] : []
      const nextIndex = handleArrowKeys(e)
      const nextItemId = displayItems[nextIndex].id
      selected.push(nextItemId)

      if (e.shiftKey) select(selected, true)

      return
    }

    if (e.key === 'Enter') {
      if (focusedItemIdRef.current) {
        const type = JSONUtil.getItemType(json, focusedItemIdRef.current)
        if (type === 'value') {
          setSelectedItemIds({ [focusedItemIdRef.current]: true })
          setRightNavTab(TAB.PROPERTIES)
        } else if (onItemEnter) {
          onItemEnter(focusedItemIdRef.current)
          clearSelect()
        }
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setSelectedItemIds({})
      return
    }

    if (e.key === ' ' && focusedItemIdRef.current) {
      e.preventDefault()
      const selected = [focusedItemIdRef.current]
      let multi = false

      if (e.ctrlKey || e.metaKey) {
        if (selectedItemIds[focusedItemIdRef.current]) {
          selected.pop()
          const newSelectedItemIds = structuredClone(selectedItemIds)
          delete newSelectedItemIds[focusedItemIdRef.current]
          selected.push(...Object.keys(newSelectedItemIds))
        } else {
          multi = true
        }
      }

      select([...selected], multi)
      return
    }

    if (e.key === 'Backspace') {
      goBackward()
      clearSelect()
      return
    }

    if (e.key === 'Delete') {
      e.preventDefault()
      const result = JSONUtil.deleteItems(json, Object.keys(selectedItemIds))
      setJson(result)
      clearSelect()
      return
    }

    if (e.key === 'ContextMenu') {
      if (
        focusedItemIdRef.current &&
        !selectedItemIds[focusedItemIdRef.current]
      ) {
        setSelectedItemIds((prev) => ({
          ...prev,
          [focusedItemIdRef.current!]: true,
        }))
        return
      }
    }

    if (e.ctrlKey || e.metaKey) {
      handleFunctionKeys(e)
      return
    }
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    delete pushedKeysRef.current[e.key]
  }

  useEffect(() => {
    if (!containerRef?.current || !scrollRef?.current) return
    setContainerRect(containerRef.current.getBoundingClientRect())
  }, [containerRef, isReady, scrollRef])

  useEffect(() => {
    const itemIds = Object.keys(selectedItemIds)
    if (itemIds.length === 1) {
      const id = itemIds[0]
      focusedItemIdRef.current = id
      setItemIndex(getItemIndex(id))
    }
  }, [getItemIndex, selectedItemIds])

  useEffect(() => {
    if (!focusedItemIdRef.current || !scrollRef?.current) return

    const itemArea = itemAreas[focusedItemIdRef.current]
    if (!itemArea) return

    const { y, height } = itemArea
    const scrollContainer = scrollRef.current
    const currentHeight = containerRect.height + scrollContainer.scrollTop

    if (
      (currentHeight && currentHeight < y + height) ||
      scrollContainer.scrollTop > y
    ) {
      scrollIntoView(y, height)
    }
  }, [itemIndex, itemAreas, containerRect, scrollRef, scrollIntoView])

  return { focusedItemIdRef, pushedKeysRef, onKeyDown, onKeyUp }
}
