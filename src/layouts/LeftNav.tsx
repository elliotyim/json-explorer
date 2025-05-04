import { DndTree } from '@/components/ui/dnd-tree/DndTree'
import { JSONUtil } from '@/utils/json'
import { DropOptions, NodeModel } from '@minoru/react-dnd-treeview'
import { useCallback, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[]
  onItemDrop: (newJson: Record<string, unknown> | unknown[]) => void
}

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  onItemDrop,
  ...props
}) => {
  const [data, setData] = useState<NodeModel<CustomData>[]>(
    JSONUtil.flatten({ input: json }),
  )

  const handleDrop = useCallback(
    (_: NodeModel<CustomData>[], options: DropOptions<CustomData>) => {
      if (options.dragSource === undefined) return
      JSONUtil.move(
        json,
        options.dropTargetId as string,
        options.dragSource,
        options.relativeIndex,
      )

      const newJson = structuredClone(json)
      const newData = JSONUtil.flatten({ input: newJson })

      onItemDrop(newJson)
      setData(newData)
    },
    [json, onItemDrop],
  )

  return (
    <div {...props}>
      <DndTree
        data={data}
        onDrop={handleDrop}
        onClickItem={(node) => console.log(node)}
      />
    </div>
  )
}

export default LeftNav
