import React from 'react'
import { FaFile, FaFileImage, FaFolder, FaRectangleList } from 'react-icons/fa6'

interface Props {
  droppable: boolean
  fileType?: string
}

export const TypeIcon: React.FC<Props> = (props) => {
  if (props.droppable) {
    return <FaFolder />
  }

  switch (props.fileType) {
    case 'image':
      return <FaFileImage />
    case 'csv':
      return <FaRectangleList />
    case 'text':
      return <FaFile />
    default:
      return null
  }
}
