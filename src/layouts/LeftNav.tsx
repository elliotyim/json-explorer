import TreeNode from '@/components/dnd-tree/TreeNode'
import { Input } from '@/components/ui/input'
import { TAB } from '@/constants/tab'
import { TREE_NODE } from '@/constants/tree'
import { useCurrentItemStore, useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'
import { useEffect, useRef, useState } from 'react'
import { MoveHandler, NodeApi, Tree, TreeApi } from 'react-arborist'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { AutoSizer } from 'react-virtualized'
import { useDebouncedCallback } from 'use-debounce'

interface Props {
  json: Record<string, unknown> | unknown[]
  treeRef: React.RefObject<TreeApi<Data> | null>
  enterFolder: (id: string) => void
}

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  treeRef,
  enterFolder,
  ...props
}) => {
  const pushedKeys = useRef<Record<string, boolean>>({})

  const [data, setData] = useState<Data[]>()
  const [term, setTerm] = useState<string>('')

  const { setJson } = useJsonStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { setSelectedItemIds } = useSelectedItemIdsStore()

  const debouncedValueChange = useDebouncedCallback((value) => {
    setTerm(value)
  }, 300)

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') treeRef?.current?.deselectAll()
    pushedKeys.current[e.key] = true
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    delete pushedKeys.current[e.key]
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
      } else if (enterFolder) {
        enterFolder(node.id)
      }
    } else {
      const items: Record<string, boolean> = {}
      nodes.forEach((node) => (items[node.data.id] = true))
      setSelectedItemIds(items)
    }
  }

  const handleItemMove: MoveHandler<Data> = ({
    dragNodes,
    parentId,
    parentNode,
  }) => {
    if (parentId == null) return

    let targetIndex: number
    if (parentNode?.data.type !== 'array') targetIndex = -1
    else targetIndex = treeRef?.current?.dragDestinationIndex ?? -1

    const trailingParentIds = new Set(JSONUtil.getTrailingPaths(parentId))
    const folders = new Set()

    const filteredNodes = [...dragNodes]
      .filter(
        (node) =>
          !(
            node.parent?.id === parentId && node.parent?.data.type === 'object'
          ),
      )
      .sort((a, b) => a.id.length - b.id.length)
      .filter((node) => !trailingParentIds.has(node.id)) // Remove improper folders
      .filter((node) => {
        if (node.data.type !== 'value') folders.add(node.id)
        return !folders.has(node.parent?.id) // Remove subordinate items in selected folders
      })

    const sortedNodes = filteredNodes.sort((a, b) => {
      const parentIdA = a.parent?.id ?? ''
      const parentIdB = b.parent?.id ?? ''

      if (parentIdA.length > parentIdB.length) return 1
      if (parentIdA.length < parentIdB.length) return -1
      if (parentIdA.localeCompare(parentIdB) > 0) return 1
      if (parentIdA.localeCompare(parentIdB) < 0) return -1
      return a.id.localeCompare(b.id)
    })

    sortedNodes.forEach((node) =>
      JSONUtil.copy({ obj: json, from: node.id, to: parentId }),
    )

    let destination = parentId
    const reversed = [...sortedNodes].reverse()

    reversed.forEach((node) => {
      const parent = JSONUtil.getByPath(json, node.parent?.id ?? '')

      const lastKey = JSONUtil.getSplitPaths({ path: node.id }).at(-1)
      if (
        destination === node.parent?.id &&
        lastKey != null &&
        +lastKey < targetIndex
      ) {
        targetIndex--
      }

      JSONUtil.remove(parent, node.id)
      if (node.parent?.data.type === 'array') {
        destination = JSONUtil.adjustArrayPath(node.id, destination)
      }
    })

    if (parentNode?.data.type === 'array') {
      const parentObj = JSONUtil.getByPath(json, destination)
      if (!Array.isArray(parentObj)) return

      const start = parentObj.length - sortedNodes.length
      const selectedNodes: { index: number; data: Data }[] = sortedNodes.map(
        (node, i) => {
          const type = node.parent?.data.type === 'object' ? 'object' : 'value'
          const index = start + i
          const id = `${destination}[${start + i}]`
          const name = type === 'object' ? node.data.name : `${index}`
          const parentPath = destination
          const value = node.data.value

          const data = { id, name, parentPath, type: type as 'value', value }
          const source = { index, data }
          return source
        },
      )
      json = JSONUtil.relocate(json, targetIndex, selectedNodes) as unknown[]
    }

    setJson(structuredClone(json))
    enterFolder(destination)
  }

  const handleItemClick = (
    node: NodeApi<Data>,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (node.data.type === 'value') {
      const clickCount = e.detail
      if (clickCount === 2) {
        if (node.parent) {
          treeRef.current?.open(node.parent?.data.id ?? '')
          enterFolder(node.parent?.data.id ?? '')
        }

        const timer = setTimeout(() => {
          treeRef.current?.focus(node)
          setSelectedItemIds({ [node.id]: true })
          setRightNavTab(TAB.PROPERTIES)
          clearTimeout(timer)
        }, 0)
      }
    } else if (
      !pushedKeys.current['Shift'] &&
      !pushedKeys.current['Control'] &&
      !pushedKeys.current['Meta']
    ) {
      treeRef.current?.open(node.id)
      enterFolder(node.id)
    }
  }

  useEffect(() => setData(JSONUtil.compile({ input: json })), [json])
  useEffect(() => treeRef.current?.open('root'), [treeRef])

  return (
    <div {...props} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      <div className="flex h-full w-full flex-col">
        <div className="flex w-full items-center gap-2 border-b-2 border-slate-200 p-2">
          <div className="flex-shrink-0">
            <FaMagnifyingGlass size={20} />
          </div>
          <Input onChange={(e) => debouncedValueChange(e.target.value)} />
        </div>
        <div className="h-full w-full">
          <AutoSizer>
            {({ width, height }) => (
              <div className="overflow-auto" style={{ width, height }}>
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
                  onMove={handleItemMove}
                  openByDefault={false}
                >
                  {(props) => (
                    <TreeNode onItemClick={handleItemClick} {...props} />
                  )}
                </Tree>
              </div>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  )
}

export default LeftNav
