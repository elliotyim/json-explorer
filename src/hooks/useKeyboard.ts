import { TAB } from '@/constants/tab'
import {
  useCurrentItemStore,
  useDisplayItemsStore,
  useFocusedItem,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'
import { MathUtil } from '@/utils/math'
import { useState } from 'react'
import { useHistory } from './useHistory'

interface Props {
  containerWidth: number
  onItemEnter?: (itemId: string) => void
}

interface ReturnProps {
  focusedItemId: string | null
  pushedKeys: Record<string, boolean>
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

export const useKeyboardAction = ({
  containerWidth,
  onItemEnter,
}: Props): ReturnProps => {
  const { json, setJson } = useJsonStore()
  const { currentItem } = useCurrentItemStore()
  const { displayItems } = useDisplayItemsStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { focusedItemId, setFocusedItemId } = useFocusedItem()
  const { setRightNavTab } = useRightNavTabStore()
  const { goBackward } = useHistory()

  const [pushedKeys, setPushedKeys] = useState<Record<string, boolean>>({})
  const [itemIndex, setItemIndex] = useState<number>(-1)

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
    setFocusedItemId(null)
  }

  const handleArrowKeys = (e: React.KeyboardEvent<HTMLDivElement>): number => {
    const columnOffset = MathUtil.countColumn(containerWidth)
    let nextIndex = -1,
      nextItemId = ''
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = Math.max(0, itemIndex - columnOffset)
      nextItemId = displayItems[nextIndex].id
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = Math.min(itemIndex + 1, displayItems.length - 1)
      nextItemId = displayItems[nextIndex].id
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = Math.min(itemIndex + columnOffset, displayItems.length - 1)
      nextItemId = displayItems[nextIndex].id
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = Math.max(0, itemIndex - 1)
      nextItemId = displayItems[nextIndex].id
    }

    if (itemIndex === nextIndex) return nextIndex

    if (nextIndex > -1 && nextItemId) {
      setItemIndex(nextIndex)
      setFocusedItemId(nextItemId)
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
    if (!pushedKeys[e.key]) {
      setPushedKeys((prev) => ({ ...prev, [e.key]: true }))
    }

    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft'
    ) {
      const selected = focusedItemId != null ? [focusedItemId] : []
      const nextIndex = handleArrowKeys(e)
      const nextItemId = displayItems[nextIndex].id
      selected.push(nextItemId)
      if (e.shiftKey) select(selected, true)
      return
    }

    if (e.key === 'Enter') {
      if (focusedItemId) {
        const type = JSONUtil.getItemType(json, focusedItemId)
        if (type === 'value') {
          setSelectedItemIds({ [focusedItemId]: true })
          setRightNavTab(TAB.PROPERTIES)
        } else if (onItemEnter) {
          onItemEnter(focusedItemId)
          setItemIndex(-1)
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

    if (e.key === ' ' && focusedItemId) {
      const selected = [focusedItemId]
      let multi = false

      if (e.ctrlKey || e.metaKey) {
        if (selectedItemIds[focusedItemId]) {
          selected.pop()
          const newSelectedItemIds = structuredClone(selectedItemIds)
          delete newSelectedItemIds[focusedItemId]
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
      if (focusedItemId && !selectedItemIds[focusedItemId]) {
        setSelectedItemIds((prev) => ({ ...prev, [focusedItemId]: true }))
        return
      }
    }

    if (e.ctrlKey || e.metaKey) {
      handleFunctionKeys(e)
      return
    }
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    delete pushedKeys[e.key]
    setPushedKeys({ ...pushedKeys })
  }

  return { focusedItemId, pushedKeys, onKeyDown, onKeyUp }
}
