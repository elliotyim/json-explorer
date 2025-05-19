import { JSONUtil } from '@/utils/json'
import {
  DropOptions,
  MultiBackend,
  NodeModel,
  Tree,
  TreeMethods,
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
  currentItemId: string
  treeRef?: React.RefObject<TreeMethods | null>
  onItemDrop: (
    tree: NodeModel<CustomData>[],
    options: DropOptions<CustomData>,
  ) => void
  onClickItem?: (node: NodeModel<CustomData>) => void
}

export const DndTree: React.FC<
  React.HTMLAttributes<HTMLDivElement> & Props
> = ({ data, treeRef, currentItemId, onItemDrop, onClickItem }) => {
  const [treeData, setTreeData] = useState<NodeModel<CustomData>[]>([])

  useEffect(() => setTreeData(data), [data])

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div className={styles.app}>
        <Tree
          ref={treeRef}
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
          onDrop={onItemDrop}
          canDrop={(_, { dragSource, dropTargetId }) => {
            if (dragSource?.parent === dropTargetId) return true
          }}
          render={(node, { depth, isOpen, onToggle }) => (
            <CustomNode
              node={node}
              depth={depth}
              isOpen={isOpen}
              selected={currentItemId === node.id}
              onToggle={onToggle}
              onClickItem={(node) => {
                const paths = JSONUtil.getTrailingPaths(node.id as string)
                treeRef?.current?.open(paths)

                if (onClickItem) onClickItem(node as NodeModel<CustomData>)
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
