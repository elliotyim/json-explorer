import {
  MultiBackend,
  NodeModel,
  Tree,
  getBackendOptions,
} from '@minoru/react-dnd-treeview'
import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { CustomDragPreview } from './CustomDragPreview'
import { CustomNode } from './CustomNode'
import styles from './DndTree.module.css'
import { Placeholder } from './Placeholder'

interface Props {
  data: NodeModel<CustomData>[]
  onClickItem?: (node: NodeModel) => void
}

export const DndTree = ({ data, onClickItem }: Props) => {
  const [selectedItem, setSelectedItem] = useState<number | string | null>(null)
  const [treeData, setTreeData] = useState<NodeModel<CustomData>[]>(data)

  const handleDrop = (newTree: NodeModel<CustomData>[]) => setTreeData(newTree)

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div className={styles.app}>
        <Tree
          tree={treeData}
          rootId={0}
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
          onDrop={handleDrop}
          classes={{
            root: styles.treeRoot,
            draggingSource: styles.draggingSource,
            dropTarget: styles.dropTarget,
            placeholder: styles.placeholderContainer,
          }}
          sort={false}
          insertDroppableFirst={false}
          canDrop={(tree, { dragSource, dropTargetId }) => {
            if (dragSource?.parent === dropTargetId) {
              return true
            }
          }}
          dropTargetOffset={10}
          initialOpen
          placeholderRender={(node, { depth }) => (
            <Placeholder node={node} depth={depth} />
          )}
        />
      </div>
    </DndProvider>
  )
}
