import { NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useRef } from 'react'
import { useDrag, useDrop, XYCoord } from 'react-dnd'
import { TypeIcon } from '../dnd-tree/TypeIcon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

import { Identifier } from 'dnd-core'
import { DOMUtil } from '@/utils/dom'

interface Props {
  item: NodeModel<CustomData>
  index: number
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    relativeIndex?: number,
  ) => void
  setDraggingItemId?: (id: string | null) => void
}

interface DragItem extends NodeModel<CustomData> {
  index: number
}

const ItemTypes = {
  CARD: 'card',
}

const GridCard: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  item,
  index,
  setDraggingItemId,
  onItemMove,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const truncate = (title: string) => {
    const len = 9
    if (title.length > len) return title.substring(0, len) + '..'
    return title
  }

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    item: () => ({ ...item, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end(_, monitor) {
      if (monitor.didDrop() && setDraggingItemId) setDraggingItemId(null)
    },
  }))

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.CARD,
    collect: (monitor) => ({ handlerId: monitor.getHandlerId() }),
    hover(item: DragItem, monitor) {
      if (!ref.current) return

      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) return

      const hoverBoundingRect = ref.current.getBoundingClientRect()

      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2

      const clientOffset = monitor.getClientOffset()

      const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return

      console.log(dragIndex, hoverIndex)
    },
    drop(item, monitor) {
      const containerDiv = ref.current?.parentElement
      const clientOffset = monitor.getClientOffset()
      const sourceOffset = monitor.getInitialSourceClientOffset()

      if (!containerDiv || !sourceOffset || !clientOffset) return

      const containerRect = containerDiv.getBoundingClientRect()

      const sourceX = sourceOffset.x - containerRect.x
      const sourceY = sourceOffset.y - containerRect.y
      const source = DOMUtil.getDivOnPointer(sourceX, sourceY, containerDiv)

      const targetX = clientOffset.x - containerRect.x
      const targetY = clientOffset.y - containerRect.y
      const target = DOMUtil.getDivOnPointer(targetX, targetY, containerDiv)

      let relativeIndex
      if (target?.dataset.type === 'array') relativeIndex = -1
      else relativeIndex = +(source?.dataset.index ?? -1)

      const targetType = target?.dataset.type

      if (targetType !== 'object' && targetType !== 'array') return

      if (!source || !target || source === target) return
      if (onItemMove) onItemMove(source, target, relativeIndex)
    },
  })

  drag(drop(ref))

  useEffect(() => {
    if (isDragging && setDraggingItemId) setDraggingItemId(`${item.id}`)
  }, [isDragging, item.id, setDraggingItemId])

  return (
    <Card
      ref={ref}
      {...props}
      data-index={index}
      data-type={item.data?.type}
      data-handler-id={handlerId}
      style={{ opacity: isDragging ? 0.2 : 1 }}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeIcon node={item} isOpen={false} />
                <span>{truncate(item.text)}</span>
              </div>
            </div>
          </div>
        </CardTitle>
        <CardDescription>{item.data?.type}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="truncate">
          {JSON.stringify(item.data?.value, null, 1)}
        </div>
      </CardContent>
    </Card>
  )
}

export default GridCard
