import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import { TAB } from '@/constants/tab'
import { cn } from '@/lib/utils'
import { useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'
import { useEffect, useRef, useState } from 'react'
import {
  MoveHandler,
  NodeApi,
  NodeRendererProps,
  Tree,
  TreeApi,
} from 'react-arborist'
import { FaCaretRight } from 'react-icons/fa6'
import { AutoSizer } from 'react-virtualized'

interface Props {
  json: Record<string, unknown> | unknown[]
  errorMessage: string | null
  currentItemId: string
  treeRef: React.RefObject<TreeApi<Data> | null>
  enterFolder: (id: string) => void
}

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  errorMessage,
  currentItemId,
  treeRef,
  enterFolder,
  ...props
}) => {
  const [data, setData] = useState<Data[]>()
  const pushedKeys = useRef<Record<string, boolean>>({})

  const { setJson } = useJsonStore()

  useEffect(() => setData(JSONUtil.compile({ input: json })), [json])
  useEffect(
    () => treeRef?.current?.select(currentItemId, { focus: true }),
    [currentItemId, treeRef],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') treeRef?.current?.deselectAll()
    pushedKeys.current[e.key] = true
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    delete pushedKeys.current[e.key]
  }

  const onSelect = (nodes: NodeApi<Data>[]) => {
    if (nodes.length === 1 && !pushedKeys.current['Shift']) {
      const node = nodes[0]
      if (node.data.type !== 'value' && enterFolder) enterFolder(node.id)
    }
  }

  const onMove: MoveHandler<Data> = ({ dragNodes, parentId, parentNode }) => {
    if (parentId == null) return

    let targetIndex: number
    if (parentNode?.data.type !== 'array') targetIndex = -1
    else targetIndex = treeRef?.current?.dragDestinationIndex ?? -1

    const trailingParentIds = new Set(JSONUtil.getTrailingPaths(parentId))
    const folders = new Set()

    const filteredNodes = [...dragNodes]
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

    const reversed = [...sortedNodes].reverse()
    reversed.forEach((node) => {
      const parent = JSONUtil.getByPath(json, node.parent?.id ?? '')

      const lastKey = JSONUtil.getSplitPaths({ path: node.id }).at(-1)
      if (
        parentId === node.parent?.id &&
        lastKey != null &&
        +lastKey < targetIndex
      ) {
        targetIndex--
      }

      JSONUtil.remove(parent, node.id)
    })

    if (parentNode?.data.type === 'array') {
      const parentObj = JSONUtil.getByPath(json, parentId)
      if (!Array.isArray(parentObj)) return

      const start = parentObj.length - sortedNodes.length
      const selectedNodes: { index: number; data: Data }[] = sortedNodes.map(
        (node, i) => {
          const type = node.parent?.data.type === 'object' ? 'object' : 'value'
          const index = start + i
          const id = `${parentId}[${start + i}]`
          const name = type === 'object' ? node.data.name : `${index}`
          const parentPath = parentId
          const value = node.data.value

          const data = { id, name, parentPath, type: type as 'value', value }
          const nodes = { index, data }
          return nodes
        },
      )
      json = JSONUtil.relocate(json, targetIndex, selectedNodes) as unknown[]
    }

    setJson(structuredClone(json))
    enterFolder(parentId)
  }

  const Node = ({ tree, node, style, dragHandle }: NodeRendererProps<Data>) => {
    const { setRightNavTab } = useRightNavTabStore()
    const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()

    const onCaretClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (node.isOpen) tree.close(node.id)
      else tree.open(node.id)
    }

    const handleItemClick = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      if (node.data.type === 'value') {
        if (e.detail === 2) {
          if (node.parent) {
            tree.open(node.parent?.data.id ?? '')
            enterFolder(node.parent?.data.id ?? '')
          }

          const timer = setTimeout(() => {
            tree.focus(node)
            setSelectedItemIds({ [node.id]: true })
            setRightNavTab(TAB.PROPERTIES)
            clearTimeout(timer)
          }, 0)
        }
      } else if (Object.keys(selectedItemIds).length) {
        tree.open(node.id)
        enterFolder(node.id)
      }
    }

    const highlight = (node: NodeApi<Data>): string => {
      let className = ''
      if (node.id === currentItemId) className = 'bg-blue-300'
      else if (node.isFocused) className = 'bg-gray-400'
      else if (node.isSelected) className = 'bg-gray-300'
      return className
    }

    return (
      <div
        className={cn(
          'flex h-[32px] items-center border-b border-slate-200 ps-2 pe-2',
          highlight(node),
        )}
        style={style}
        ref={dragHandle}
        onClick={handleItemClick}
      >
        <div className="flex h-[24px] w-[24px] items-center justify-center">
          {node.data.type !== 'value' ? (
            <FaCaretRight
              className={cn(
                `cursor-pointer transition-transform duration-100 ease-linear`,
                node.isOpen ? 'rotate-90' : 'rotate-0',
              )}
              onClick={onCaretClick}
            />
          ) : null}
        </div>
        <TypeIcon type={node.data.type} isOpen={node.isOpen} />
        <span className="ps-2">{node.data.name}</span>
      </div>
    )
  }

  return (
    <div {...props} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      <span className={cn(errorMessage ? null : 'hidden')}>{errorMessage}</span>
      <div className={cn('h-full', errorMessage ? 'hidden' : null)}>
        <div className="flex h-full flex-col gap-1">
          <AutoSizer>
            {({ height, width }) => (
              <Tree<Data>
                ref={treeRef}
                data={data}
                width={width}
                height={height}
                rowHeight={32}
                onSelect={onSelect}
                onMove={onMove}
                openByDefault={false}
              >
                {Node}
              </Tree>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  )
}

export default LeftNav
