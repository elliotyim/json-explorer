import { DndTree } from '@/components/dnd-tree/DndTree'
import { cn } from '@/lib/utils'
import { JSONUtil } from '@/utils/json'
import { DropOptions, NodeModel, TreeMethods } from '@minoru/react-dnd-treeview'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[]
  errorMessage: string | null
  currentItemId: string
  treeRef?: React.RefObject<TreeMethods | null>
  onClickItem?: ((node: NodeModel<CustomData>) => void) | undefined
  onItemDrop?: (newJson: Record<string, unknown> | unknown[]) => void
}

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  errorMessage,
  currentItemId,
  treeRef,
  onClickItem,
  onItemDrop,
  ...props
}) => {
  const [data, setData] = useState<NodeModel<CustomData>[]>([])

  useEffect(() => setData(JSONUtil.flatten({ input: json })), [json])

  const handleDrop = useCallback(
    (_: NodeModel<CustomData>[], options: DropOptions<CustomData>) => {
      if (options.dragSource === undefined || json === undefined) return

      let targetIndex
      if (options.dropTarget?.data?.type !== 'array') targetIndex = -1
      else targetIndex = options.relativeIndex ? options.relativeIndex : -1

      JSONUtil.move({
        obj: json,
        from: options.dragSource.id as string,
        to: options.dropTargetId as string,
        targetIndex,
      })

      const newJson = structuredClone(json)
      const newData = JSONUtil.flatten({ input: newJson })

      if (onItemDrop) onItemDrop(newJson)
      setData(newData)
    },
    [json, onItemDrop],
  )

  return (
    <div {...props}>
      <span className={cn(errorMessage ? null : 'hidden')}>{errorMessage}</span>
      <div className={cn('h-full', errorMessage ? 'hidden' : null)}>
        <DndTree
          data={data}
          currentItemId={currentItemId}
          treeRef={treeRef}
          onItemDrop={handleDrop}
          onClickItem={onClickItem}
        />
      </div>
    </div>
  )
}

export default LeftNav
