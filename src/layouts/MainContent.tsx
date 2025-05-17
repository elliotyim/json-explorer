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

  const handleItemEdit = () => {
    if (Object.keys(selectedItemIds).length === 1) {
      setRightNavTab(TAB.PROPERTIES)
      const timer = setTimeout(() => {
        setIsItemEditing(true)
        clearTimeout(timer)
      }, 100)
    }
  }

  const handleItemDelete = () => {
    const ids = Object.keys(selectedItemIds)
    if (!ids.length) return

    const parentPath = JSONUtil.getParentPath(ids[0])
    const parent = JSONUtil.getByPath(json, parentPath)

    JSONUtil.removeAll(parent, ids)
    setJson(structuredClone(json))
    setSelectedItemIds({})
  }

  const handleItemProperties = () => {
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
            json={json}
            items={displayItems}
            selectedItemId={selectedItemId}
            onItemRelocation={onItemRelocation}
            onItemMove={onItemMove}
            onItemEnter={onItemEnter}
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem inset>Copy</ContextMenuItem>
          <ContextMenuItem inset disabled>
            Paste
          </ContextMenuItem>
          <ContextMenuItem inset>Cut</ContextMenuItem>

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
              <ContextMenuItem>Array</ContextMenuItem>
              <ContextMenuItem>Object</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Value</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem inset onSelect={handleItemProperties}>
            Properties
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export default MainContent
