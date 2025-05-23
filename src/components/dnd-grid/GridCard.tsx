import { useEffect, useRef, useState } from 'react'
import { useDrag, useDrop, XYCoord } from 'react-dnd'
import { TypeIcon } from '../dnd-tree/TypeIcon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

import { DOMUtil } from '@/utils/dom'
import { Identifier } from 'dnd-core'

interface Props {
  item: Data
  index: number
  parentType: Data['type']
  onItemRelocation?: (targetIndex: number) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    targetIndex?: number,
  ) => void
  setDraggingItemId?: (id: string | null) => void
}

interface DragItem extends Data {
  index: number
}

const ItemTypes = {
  CARD: 'card',
}

const GridCard: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  item,
  index,
  parentType,
  setDraggingItemId,
  onItemRelocation,
  onItemMove,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<NodeJS.Timeout>(null)

  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [onRight, setOnRight] = useState<boolean>(false)
  const [onLeft, setOnLeft] = useState<boolean>(false)

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

      setIsHovering(true)
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      timer.current = setTimeout(() => {
        setIsHovering(false)
      }, 0)

      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) return

      const hoverBoundingRect = ref.current.getBoundingClientRect()

      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2

      const clientOffset = monitor.getClientOffset()

      const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left

      const width = hoverBoundingRect.width
      const offset = 30

      if (parentType === 'array') {
        if (
          hoverClientX < 0 ||
          hoverClientX > width ||
          (offset <= hoverClientX && hoverClientX < width - offset)
        ) {
          if (onLeft) setOnLeft(false)
          if (onRight) setOnRight(false)
        } else if (hoverClientX < offset) {
          if (!onLeft) setOnLeft(true)
        } else if (width - offset <= hoverClientX) {
          if (!onRight) setOnRight(true)
        }
      }

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return
    },
    drop(_, monitor) {
      const targetCell = ref.current?.parentElement
      const containerDiv = targetCell?.parentElement
      const sourceOffset = monitor.getInitialSourceClientOffset()
      const clientOffset = monitor.getClientOffset()

      if (!containerDiv || !sourceOffset || !clientOffset) return

      const containerRect = containerDiv.getBoundingClientRect()

      const sourceX = sourceOffset.x - containerRect.x
      const sourceY = sourceOffset.y - containerRect.y
      const source = DOMUtil.getDivOnPointer(
        sourceX,
        sourceY,
        containerDiv,
        true,
      )

      const targetX = clientOffset.x - containerRect.x
      const targetY = clientOffset.y - containerRect.y
      const target = DOMUtil.getDivOnPointer(
        targetX,
        targetY,
        containerDiv,
        true,
      )

      const targetType = target?.dataset.type

      setOnLeft(false)
      setOnRight(false)

      if (parentType === 'array' && (onLeft || onRight)) {
        let targetIndex = +(target?.dataset.index ?? -1)
        if (onRight && targetIndex != null) targetIndex++

        if (onItemRelocation) onItemRelocation(targetIndex)
        return
      }
      if (targetType !== 'object' && targetType !== 'array') return
      if (!source || !target || source === target) return

      if (onItemMove) onItemMove(source, target)
    },
  })

  useEffect(() => {
    if (isDragging && setDraggingItemId) setDraggingItemId(`${item.id}`)
  }, [isDragging, item.id, setDraggingItemId])

  useEffect(() => {
    if (!isHovering && (onLeft || onRight)) {
      setOnLeft(false)
      setOnRight(false)
    }
  }, [isHovering, onLeft, onRight])

  drag(drop(ref))

  return (
    <Card
      ref={ref}
      data-index={index}
      data-type={item.type}
      data-handler-id={handlerId}
      style={{
        opacity: isDragging ? 0.2 : 1,
        borderLeftColor: onLeft ? 'red' : undefined,
        borderLeftWidth: onLeft ? '3px' : undefined,
        borderRightColor: onRight ? 'red' : undefined,
        borderRightWidth: onRight ? '3px' : undefined,
      }}
      {...props}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeIcon type={item.type} />
                <span>{truncate(item.name)}</span>
              </div>
            </div>
          </div>
        </CardTitle>
        <CardDescription>{item.type}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="truncate">{JSON.stringify(item.value, null, 1)}</div>
      </CardContent>
    </Card>
  )
}

export default GridCard
