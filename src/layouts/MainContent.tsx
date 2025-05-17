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

  const deleteItems = () => {
    const ids = Object.keys(selectedItemIds)
    if (!ids.length) return

    const parentPath = JSONUtil.getParentPath(ids[0])
    const parent = JSONUtil.getByPath(json, parentPath)

    JSONUtil.removeAll(parent, ids)
    setJson(structuredClone(json))
    setSelectedItemIds({})
  }

  const copyItems = () => {
    const ids = Object.keys(selectedItemIds)
    if (!ids.length) return

    const result = ids.map((id) => {
      const target = JSONUtil.inspect({ obj: json, path: id })
      return { [target.text]: target.data?.value }
    })

    sessionStorage.setItem('copyPaste', JSON.stringify(result))
  }

  const pastItems = async () => {
    const jsonString = sessionStorage.getItem('copyPaste')
    if (jsonString != null) {
      const target = JSONUtil.getByPath(json, selectedItemId)
      const sources = JSON.parse(jsonString)

      if (Array.isArray(target)) {
        for (const source of sources) {
          Object.values(source).forEach((val) => target.push(val))
        }
      } else {
        for (const source of sources) {
          for (const [key, value] of Object.entries(source)) {
            const typedTarget = target as Record<string, unknown>
            if (typedTarget[key]) typedTarget[`${key}_copy`] = value
            else typedTarget[key] = value
          }
        }
      }

      JSONUtil.set({ obj: json, keyPath: selectedItemId, value: target })
      setJson(structuredClone(json))
    }
  }

  const cutItems = () => {
    const ids = Object.keys(selectedItemIds)
    if (!ids.length) return

    copyItems()
    deleteItems()
  }

  const editItem = () => {
    const ids = Object.keys(selectedItemIds)
    if (ids.length === 1) {
      setRightNavTab(TAB.PROPERTIES)
      const timer = setTimeout(() => {
        setIsItemEditing(true)
        clearTimeout(timer)
      }, 100)
    }
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
            json={json}
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
            onSelect={copyItems}
          >
            Copy
          </ContextMenuItem>
          <ContextMenuItem
            inset
            disabled={
              sessionStorage.getItem('copyPaste') == null ? true : false
            }
            onSelect={pastItems}
          >
            Paste
          </ContextMenuItem>
          <ContextMenuItem
            inset
            disabled={!Object.keys(selectedItemIds).length}
            onSelect={cutItems}
          >
            Cut
          </ContextMenuItem>

          <ContextMenuSeparator />
          <ContextMenuItem inset onSelect={editItem}>
            Modify
          </ContextMenuItem>
          <ContextMenuItem inset onSelect={deleteItems}>
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
          <ContextMenuItem inset onSelect={showProperties}>
            Properties
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export default MainContent
