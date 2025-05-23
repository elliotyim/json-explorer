import GridContainer from '@/components/dnd-grid/GridContainer'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { TAB } from '@/constants/tab'
import { useItemEditingStore, useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'
import { useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[]
  currentItem: CurrentItem
  onItemRelocation?: (
    targetIndex: number,
    selectedNodes: {
      index: number
      item: Data
    }[],
  ) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: Data[],
    targetIndex?: number,
  ) => void
  onItemEnter?: (itemId: string) => void
}

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  currentItem,
  onItemRelocation,
  onItemMove,
  onItemEnter,
  ...props
}) => {
  const [displayItems, setDisplayItems] = useState<Data[]>([])

  const { setJson } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { setIsItemEditing } = useItemEditingStore()
  const { setRightNavTab } = useRightNavTabStore()

  const handleItemCopy = () => {
    JSONUtil.copyItems(json, Object.keys(selectedItemIds))
  }

  const handleItemPaste = async () => {
    const result = JSONUtil.pastItems(json, currentItem.id)
    setJson(result)
  }

  const handleItemCut = () => {
    const result = JSONUtil.cutItems(json, Object.keys(selectedItemIds))
    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemEdit = () => {
    const ids = Object.keys(selectedItemIds)
    if (ids.length === 1) {
      setRightNavTab(TAB.PROPERTIES)
      const timer = setTimeout(() => {
        setIsItemEditing(true)
        clearTimeout(timer)
      }, 0)
    }
  }

  const handleItemDelete = () => {
    const result = JSONUtil.deleteItems(json, Object.keys(selectedItemIds))
    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemCreate = (type: Data['type']) => {
    const id = currentItem.id
    const itemSpec = JSONUtil.inspect({ obj: json, path: id })
    const item = JSONUtil.getByPath(json, id) as Record<string, unknown>

    let value
    if (type === 'array') value = []
    else if (type === 'object') value = {}
    else value = null

    let newItemPath
    if (Array.isArray(item)) {
      newItemPath = `${itemSpec.id}[${item.length}]`
      item.push(value)
    } else {
      const key = `new${type}`
      newItemPath = `${itemSpec.id}.${key}`
      item[key] = value
    }

    JSONUtil.set({ obj: json, keyPath: id, value: item })
    setJson(structuredClone(json))

    setRightNavTab(TAB.PROPERTIES)
    setSelectedItemIds({ [newItemPath]: true })

    const timer = setTimeout(() => {
      setIsItemEditing(true)
      clearTimeout(timer)
    }, 0)
  }

  const showProperties = () => {
    setRightNavTab(TAB.PROPERTIES)
  }

  useEffect(() => {
    if (!currentItem.data) return

    const input = JSONUtil.getByPath(json, currentItem.id)
    const data = JSONUtil.flatten({
      input,
      parentPath: currentItem.id,
      depth: 1,
    })

    setDisplayItems(data)
  }, [json, currentItem.id, currentItem.data])

  return (
    <div {...props}>
      <ContextMenu>
        <ContextMenuTrigger>
          <GridContainer
            items={displayItems}
            currentItemId={currentItem.id}
            onItemRelocation={onItemRelocation}
            onItemMove={onItemMove}
            onItemEnter={onItemEnter}
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem
            inset
            disabled={!Object.keys(selectedItemIds).length}
            onSelect={handleItemCopy}
          >
            Copy
          </ContextMenuItem>
          <ContextMenuItem
            inset
            disabled={
              sessionStorage.getItem('copyPaste') == null ? true : false
            }
            onSelect={handleItemPaste}
          >
            Paste
          </ContextMenuItem>
          <ContextMenuItem
            inset
            disabled={!Object.keys(selectedItemIds).length}
            onSelect={handleItemCut}
          >
            Cut
          </ContextMenuItem>

          <ContextMenuSeparator />
          <ContextMenuItem
            inset
            disabled={!Object.keys(selectedItemIds).length}
            onSelect={handleItemEdit}
          >
            Modify
          </ContextMenuItem>
          <ContextMenuItem
            inset
            disabled={!Object.keys(selectedItemIds).length}
            onSelect={handleItemDelete}
          >
            Delete
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger inset>New</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onSelect={() => handleItemCreate('array')}>
                Array
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleItemCreate('object')}>
                Object
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handleItemCreate('value')}>
                Value
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem inset onSelect={showProperties}>
            Properties
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export default MainContent
