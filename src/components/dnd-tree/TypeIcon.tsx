import React from 'react'
import {
  FaFolder,
  FaFolderOpen,
  FaKey,
  FaQuestion,
  FaRegFolder,
  FaRegFolderOpen,
} from 'react-icons/fa6'
import { IconBaseProps } from 'react-icons/lib'

interface Props {
  type?: Data['type']
  isOpen?: boolean
}

export const TypeIcon: React.FC<IconBaseProps & Props> = ({
  type,
  isOpen = false,
  ...props
}) => {
  switch (type) {
    case 'array':
      return isOpen ? (
        <FaRegFolderOpen {...props} />
      ) : (
        <FaRegFolder {...props} />
      )
    case 'object':
      return isOpen ? <FaFolderOpen {...props} /> : <FaFolder {...props} />
    case 'value':
      return <FaKey {...props} />
    default:
      return <FaQuestion {...props} />
  }
}
