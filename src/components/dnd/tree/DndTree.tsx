import ExplorerContextMenu from '@/components/common/ExplorerContextMenu'
import TreeNode from '@/components/dnd/tree/TreeNode'
import { TAB } from '@/constants/tab'
import { TREE_NODE } from '@/constants/tree'
import { useItemAction } from '@/hooks/useItemAction'
import { useCurrentItemStore, useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useSearchKeywordState } from '@/store/search'
import { useRightNavTabStore } from '@/store/tab'
import { useTreeRefStore } from '@/store/tree'
import { JSONUtil } from '@/utils/json'
import React, { useEffect, useRef, useState } from 'react'
import { MoveHandler, NodeApi, Tree } from 'react-arborist'
import { AutoSizer } from 'react-virtualized'

const DndTree = () => {
  const { json } = useJsonStore()
  const { term } = useSearchKeywordState()
  const { currentItem, setCurrentItem } = useCurrentItemStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { treeRef } = useTreeRefStore()

  const { enterItem, moveItems } = useItemAction()

  const pushedKeys = useRef<Record<string, boolean>>({})

  const [data, setData] = useState<Data[]>()

  const shouldRefocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'x') return true
    if (e.ctrlKey && e.key === 'd') return true
    if (e.key === 'Delete') return true
    return false
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!treeRef.current) return

    if (e.key === 'Escape') {
      e.stopPropagation()
      treeRef.current.deselectAll()
    }

    if (e.key === 'Enter') {
      const node = treeRef.current.focusedNode
      if (node != null && node.parent != null) {
        const parentId = node.parent.id
        if (node.data.type === 'value') {
          enterItem(node.parent.id)
        } else {
          const data = JSONUtil.getByPath(json, parentId) as JSONObj['type']
          setCurrentItem({ id: parentId, data })
        }

        const handle = requestAnimationFrame(() => {
          setSelectedItemIds({ [node.id]: true })
          cancelAnimationFrame(handle)
        })
      }
    }

    if (e.ctrlKey && e.key === ' ') {
      const currentId = treeRef.current.focusedNode?.id ?? ''
      const newItem = { ...selectedItemIds, [currentId]: true }
      if (selectedItemIds[currentId]) delete newItem[currentId]
      setSelectedItemIds(newItem)
    }

    if (shouldRefocus(e)) {
      let parentId = treeRef.current.focusedNode?.parent?.id ?? 'root'
      if (selectedItemIds[parentId]) parentId = 'root'
      treeRef.current.focus(parentId)
    }

    pushedKeys.current[e.key] = true
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    delete pushedKeys.current[e.key]
  }

  const handleSearch = (node: NodeApi<Data>, term: string): boolean => {
    if (!node.parent) return false
    if (node.parent.data.name?.toLowerCase().includes(term.toLowerCase())) {
      return true
    }
    if (node.data.name.toLowerCase().includes(term.toLowerCase())) {
      return true
    }
    if (
      node.data.type === 'value' &&
      `${node.data.value}`.toLowerCase().includes(term.toLowerCase())
    ) {
      return true
    }

    return false
  }

  const handleItemSelect = (nodes: NodeApi<Data>[]) => {
    if (
      nodes.length === 1 &&
      !pushedKeys.current['Shift'] &&
      !pushedKeys.current['Control'] &&
      !pushedKeys.current['Meta']
    ) {
      const node = nodes[0]
      setSelectedItemIds({ [node.data.id]: true })

      if (node.data.type === 'value') {
        if (currentItem.id !== node.parent?.id) {
          const parentId = node.parent?.id ?? ''
          enterItem(parentId)

          const timer = setTimeout(() => {
            setSelectedItemIds({ [node.data.id]: true })
            clearTimeout(timer)
          }, 0)
        }
      }
    } else {
      const items: Record<string, boolean> = {}
      nodes.forEach((node) => (items[node.data.id] = true))
      setSelectedItemIds(items)
    }
  }

  const onItemMove: MoveHandler<Data> = async ({
    dragNodes,
    parentId,
    parentNode,
  }) => {
    if (parentId == null || parentNode == null) return

    let targetIndex: number
    if (parentNode?.data.type !== 'array') targetIndex = -1
    else targetIndex = treeRef?.current?.dragDestinationIndex ?? -1

    const selectedNodes = dragNodes.map((node) => node.data)
    const newJSON = await moveItems(selectedNodes, parentNode.data, targetIndex)

    const nodeParentId = dragNodes[0].parent?.data.id
    if (dragNodes.length && nodeParentId !== parentId) {
      const id = JSONUtil.adjustedTargetId(selectedNodes, parentNode.data)
      enterItem(id, newJSON)
    }
  }

  const showProperties = (node: NodeApi<Data>) => {
    if (!node.parent || !treeRef.current) return

    treeRef.current?.open(node.parent.data.id)
    enterItem(node.parent.data.id)

    const timer = setTimeout(() => {
      treeRef.current?.focus(node)
      setSelectedItemIds({ [node.id]: true })
      setRightNavTab(TAB.PROPERTIES)
      clearTimeout(timer)
    }, 0)
  }

  const toggleFolder = (id: string) => {
    if (!treeRef.current) return
    if (treeRef.current.isOpen(id)) treeRef.current.close(id)
    else treeRef.current.open(id)
  }

  const handleItemClick = (
    node: NodeApi<Data>,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation()
      if (node.isSelected) node.deselect()
      else node.selectMulti()
    } else if (node.data.type === 'value') {
      const clickCount = e.detail
      if (clickCount === 2) showProperties(node)
    } else if (!e.shiftKey) {
      toggleFolder(node.id)
      setSelectedItemIds({ [node.id]: true })
    }
  }

  useEffect(() => treeRef.current?.open('root'), [treeRef])
  useEffect(() => setData(JSONUtil.compile({ input: json })), [json])

  return (
    <div
      className="h-full w-full"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <AutoSizer>
        {({ width, height }) => (
          <div className="overflow-auto" style={{ width, height }}>
            <ExplorerContextMenu>
              <Tree<Data>
                ref={treeRef}
                data={data}
                width="100%"
                height={height}
                indent={16}
                className="w-max pb-10"
                rowHeight={TREE_NODE.ROW_HEIGHT}
                searchTerm={term}
                searchMatch={handleSearch}
                onSelect={handleItemSelect}
                onMove={onItemMove}
                openByDefault={false}
              >
                {(props) => (
                  <TreeNode onItemClick={handleItemClick} {...props} />
                )}
              </Tree>
            </ExplorerContextMenu>
          </div>
        )}
      </AutoSizer>
    </div>
  )
}

export default DndTree
