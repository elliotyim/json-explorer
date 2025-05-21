import { cn } from '@/lib/utils'
import { NodeModel } from '@minoru/react-dnd-treeview'
import React from 'react'
import { FaCaretRight } from 'react-icons/fa6'
import styles from './CustomNode.module.css'
import { TypeIcon } from './TypeIcon'

interface Props {
  node: NodeModel<CustomData>
  depth: number
  isOpen: boolean
  selected: boolean
  onToggle: (id: NodeModel['id']) => void
  onClickItem?: (node: NodeModel) => void
}

export const CustomNode: React.FC<Props> = (props) => {
  const { text, droppable } = props.node
  const indent = props.depth * 24

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    props.onToggle(props.node.id)
  }

  return (
    <div
      className={cn(
        `tree-node`,
        `${styles.root}`,
        props.selected && styles.active,
      )}
      style={{ paddingInlineStart: indent }}
      onClick={() => {
        if (props.onClickItem) props.onClickItem(props.node)
      }}
    >
      <div
        className={cn(
          `${styles.expandIconWrapper}`,
          `${droppable && 'cursor-pointer'}`,
          `${props.isOpen ? styles.isOpen : ''}`,
        )}
      >
        {droppable && (
          <div onClick={handleToggle}>
            <FaCaretRight />
          </div>
        )}
      </div>
      <div>
        <TypeIcon type={props.node.data?.type} isOpen={props.isOpen} />
      </div>
      <div className={styles.labelGridItem}>
        <span>{text}</span>
      </div>
    </div>
  )
}
