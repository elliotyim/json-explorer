import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import { cn } from '@/lib/utils'
import { useCurrentItemStore } from '@/store/item'
import React from 'react'
import { NodeApi, NodeRendererProps } from 'react-arborist'
import { FaCaretRight } from 'react-icons/fa6'

interface Props {
  onItemClick?: (
    node: NodeApi<Data>,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void
}

const TreeNode: React.FC<NodeRendererProps<Data> & Props> = ({
  tree,
  node,
  style,
  dragHandle,
  onItemClick,
}) => {
  const { currentItem } = useCurrentItemStore()

  const onCaretClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.isOpen) tree.close(node.id)
    else tree.open(node.id)
  }

  const highlight = (node: NodeApi<Data>): string => {
    let className = ''
    if (node.id === currentItem.id) className = 'bg-blue-300'
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
      onClick={(e) => {
        if (onItemClick) onItemClick(node, e)
      }}
    >
      <div className="flex h-[24px] w-[24px] items-center justify-center">
        {node.data.type !== 'value' && (
          <FaCaretRight
            className={cn(
              `cursor-pointer transition-transform duration-100 ease-linear`,
              node.isOpen ? 'rotate-90' : 'rotate-0',
            )}
            onClick={onCaretClick}
          />
        )}
      </div>
      <TypeIcon type={node.data.type} isOpen={node.isOpen} />
      <span className="ps-2">{node.data.name}</span>
    </div>
  )
}

export default TreeNode
