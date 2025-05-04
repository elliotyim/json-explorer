import {
  DropOptions,
  MultiBackend,
  NodeModel,
  Tree,
  getBackendOptions,
} from '@minoru/react-dnd-treeview'
import { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { CustomDragPreview } from './CustomDragPreview'
import { CustomNode } from './CustomNode'
import styles from './DndTree.module.css'
import { Placeholder } from './Placeholder'

interface Props {
  data: NodeModel<CustomData>[]
  onDrop: (
    tree: NodeModel<CustomData>[],
    options: DropOptions<CustomData>,
  ) => void
  onClickItem?: (node: NodeModel) => void
}

export const DndTree = ({ data, onDrop, onClickItem }: Props) => {
  const [selectedItem, setSelectedItem] = useState<number | string | null>(null)
  const [treeData, setTreeData] = useState<NodeModel<CustomData>[]>(data)

  useEffect(() => setTreeData(data), [data])

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div className={styles.app}>
        <Tree
          tree={treeData}
          rootId={'root'}
          classes={{
            root: styles.treeRoot,
            draggingSource: styles.draggingSource,
            dropTarget: styles.dropTarget,
            placeholder: styles.placeholderContainer,
          }}
          sort={false}
          insertDroppableFirst={false}
          dropTargetOffset={10}
          enableAnimateExpand={true}
          onDrop={onDrop}
          canDrop={(_, { dragSource, dropTargetId }) => {
            if (dragSource?.parent === dropTargetId) return true
          }}
          render={(node, { depth, isOpen, onToggle }) => (
            <CustomNode
              node={node}
              depth={depth}
              isOpen={isOpen}
              selected={selectedItem === node.id}
              onToggle={onToggle}
              onClickItem={(node) => {
                setSelectedItem(node.id)
                if (onClickItem) onClickItem(node)
              }}
            />
          )}
          dragPreviewRender={(monitorProps) => (
            <CustomDragPreview monitorProps={monitorProps} />
          )}
          placeholderRender={(node, { depth }) => (
            <Placeholder node={node} depth={depth} />
          )}
        />
      </div>
    </DndProvider>
  )
}
