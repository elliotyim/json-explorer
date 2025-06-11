import TreeNode from '@/components/dnd-tree/TreeNode'
import ExplorerContextMenu from '@/components/ExplorerContextMenu'
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
import { MoveHandler, NodeApi, Tree, TreeApi } from 'react-arborist'
import { AutoSizer } from 'react-virtualized'

const DndTree = () => {
  const ref = useRef<TreeApi<Data> | null>(null)
  const pushedKeys = useRef<Record<string, boolean>>({})

  const [data, setData] = useState<Data[]>()
  const { treeRef, setTreeRef } = useTreeRefStore()

  const { json } = useJsonStore()
  const { term } = useSearchKeywordState()
  const { currentItem, setCurrentItem } = useCurrentItemStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()

  const { enterItem, moveItems } = useItemAction()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') treeRef?.current?.deselectAll()
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
          const data = JSONUtil.getByPath(json, parentId) as unknown[]

          setCurrentItem({ id: parentId, data })
          const timer = setTimeout(() => {
            setSelectedItemIds({ [node.data.id]: true })
            clearTimeout(timer)
          }, 0)
        }
      } else {
        enterItem(node.id)
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

    await moveItems(
      dragNodes.map((node) => node.data),
      parentNode.data,
      targetIndex,
    )

    const targetNode = JSONUtil.getByPath(json, parentId) as JSONObj['type']
    setCurrentItem({ id: parentNode.id, data: targetNode })
  }

  const handleItemClick = (
    node: NodeApi<Data>,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.ctrlKey && !e.metaKey) {
      e.stopPropagation()

      const newItem = { ...selectedItemIds, [node.id]: true }
      if (selectedItemIds[node.id]) delete newItem[node.id]
      setSelectedItemIds(newItem)

      treeRef.current?.focus(node)
    } else if (node.data.type === 'value') {
      const clickCount = e.detail
      if (clickCount === 2) {
        if (node.parent) {
          treeRef.current?.open(node.parent?.data.id ?? '')
          enterItem(node.parent?.data.id ?? '')
        }

        const timer = setTimeout(() => {
          treeRef.current?.focus(node)
          setSelectedItemIds({ [node.id]: true })
          setRightNavTab(TAB.PROPERTIES)
          clearTimeout(timer)
        }, 0)
      }
    } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      treeRef.current?.open(node.id)
      enterItem(node.id)
    }
  }

  useEffect(() => {
    if (!treeRef?.current) setTreeRef(ref)
  }, [setTreeRef, treeRef])
  useEffect(() => treeRef.current?.open('root'), [treeRef])
  useEffect(() => setData(JSONUtil.compile({ input: json })), [json])

  const items = Object.keys(selectedItemIds)

  return (
    <div
      className="h-full w-full"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <AutoSizer>
        {({ width, height }) => (
          <div className="overflow-auto" style={{ width, height }}>
            <ExplorerContextMenu selectedItems={items}>
              <Tree<Data>
                ref={ref}
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
