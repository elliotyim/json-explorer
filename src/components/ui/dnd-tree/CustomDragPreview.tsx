import React from 'react'
import { DragLayerMonitorProps } from '@minoru/react-dnd-treeview'
import { TypeIcon } from './TypeIcon'
import styles from './CustomDragPreview.module.css'

type Props = {
  monitorProps: DragLayerMonitorProps<CustomData>
}

export const CustomDragPreview: React.FC<Props> = (props) => {
  const item = props.monitorProps.item

  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <TypeIcon node={item} isOpen={false} />
      </div>
      <div className={styles.label}>{item.text}</div>
    </div>
  )
}
