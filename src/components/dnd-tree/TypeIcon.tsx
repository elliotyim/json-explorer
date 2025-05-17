import { NodeModel } from '@minoru/react-dnd-treeview'
import React from 'react'
import {
  FaFolder,
  FaFolderOpen,
  FaKey,
  FaRegFolder,
  FaRegFolderOpen,
} from 'react-icons/fa6'

interface Props {
  node: NodeModel<CustomData>
  size?: number
  isOpen?: boolean
}

export const TypeIcon: React.FC<
  React.HTMLAttributes<HTMLDivElement> & Props
> = ({ node, size, isOpen = false, ...props }) => {
  switch (node.data?.type) {
    case 'array':
      return isOpen ? (
        <div {...props}>
          <FaRegFolderOpen size={size} />
        </div>
      ) : (
        <div {...props}>
          <FaRegFolder size={size} />
        </div>
      )
    case 'object':
      return isOpen ? (
        <div {...props}>
          <FaFolderOpen size={size} />
        </div>
      ) : (
        <div {...props}>
          <FaFolder size={size} />
        </div>
      )
    default:
      return (
        <div {...props}>
          <FaKey size={size} />
        </div>
      )
  }
}
