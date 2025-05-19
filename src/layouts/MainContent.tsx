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
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[]
  selectedItem: Record<string, unknown> | unknown[] | undefined
  selectedItemId: string
  onItemRelocation?: (
    targetIndex: number,
    selectedNodes: {
      index: number
      item: NodeModel<CustomData>
    }[],
  ) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: NodeModel<CustomData>[],
    targetIndex?: number,
  ) => void
  onItemEnter?: (itemId: string) => void
}

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  selectedItem,
  selectedItemId,
  onItemRelocation,
  onItemMove,
  onItemEnter,
  ...props
}) => {
  const [displayItems, setDisplayItems] = useState<NodeModel<CustomData>[]>([])

  const { setJson } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { setIsItemEditing } = useItemEditingStore()
  const { setRightNavTab } = useRightNavTabStore()

  const handleItemCopy = () => {
    JSONUtil.copyItems(json, Object.keys(selectedItemIds))
  }

  const handleItemPaste = async () => {
    const result = JSONUtil.pastItems(json, selectedItemId)
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
      }, 100)
    }
  }

  const handleItemDelete = () => {
    const result = JSONUtil.deleteItems(json, Object.keys(selectedItemIds))
    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemCreate = (type: CustomData['type']) => {
    const itemSpec = JSONUtil.inspect({ obj: json, path: selectedItemId })
    const currentItem = JSONUtil.getByPath(json, selectedItemId) as Record<
      string,
      unknown
    >

    let value
    if (type === 'array') value = []
    else if (type === 'object') value = {}
    else value = null

    let newItemPath
    if (Array.isArray(currentItem)) {
      newItemPath = `${itemSpec.id}[${currentItem.length}]`
      currentItem.push(value)
    } else {
      const key = `new${type}`
      newItemPath = `${itemSpec.id}.${key}`
      currentItem[key] = value
    }

    JSONUtil.set({ obj: json, keyPath: selectedItemId, value: currentItem })
    setJson(structuredClone(json))

    setRightNavTab(TAB.PROPERTIES)
    setSelectedItemIds({ [newItemPath]: true })

    const timer = setTimeout(() => {
      setIsItemEditing(true)
      clearTimeout(timer)
    }, 100)
  }

  const showProperties = () => {
    setRightNavTab(TAB.PROPERTIES)
  }

  useEffect(() => {
    if (!selectedItem) return

    const data = JSONUtil.flatten({
      input: selectedItem,
      parentPath: selectedItemId,
      depth: 1,
    })

    setDisplayItems(data)
  }, [json, selectedItem, selectedItemId])

  return (
    <div {...props}>
      <ContextMenu>
        <ContextMenuTrigger>
          <GridContainer
            items={displayItems}
            selectedItemId={selectedItemId}
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
          <ContextMenuItem inset onSelect={handleItemEdit}>
            Modify
          </ContextMenuItem>
          <ContextMenuItem inset onSelect={handleItemDelete}>
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
