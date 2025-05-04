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
  isOpen?: boolean
}

export const TypeIcon: React.FC<Props> = ({ node, isOpen = false }) => {
  switch (node.data?.type) {
    case 'array':
      return isOpen ? <FaRegFolderOpen /> : <FaRegFolder />
    case 'object':
      return isOpen ? <FaFolderOpen /> : <FaFolder />
    default:
      return <FaKey />
  }
}
