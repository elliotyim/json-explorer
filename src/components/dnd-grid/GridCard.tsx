import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useDrag, useDrop, XYCoord } from 'react-dnd'
import { TypeIcon } from '../dnd-tree/TypeIcon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

import { useDraggingItemStore, useItemAreaStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { DOMUtil } from '@/utils/dom'
import { JSONUtil } from '@/utils/json'
import { Identifier } from 'dnd-core'
import { DRAG_ITEM, ITEM } from '@/constants/item'

interface Props {
  item: Data
  index: number
  selectedItemIds: Record<string, boolean>
  extraItemIds: Record<string, boolean>
  draggingItems: Record<string, boolean>
  style: React.CSSProperties
  onDropEnd?: () => void
  onItemRelocation?: (targetIndex: number) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    targetIndex?: number,
  ) => void
}

const GridCard = forwardRef<HTMLDivElement, Props>(
  (
    {
      item,
      index,
      onDropEnd,
      onItemRelocation,
      onItemMove,
      selectedItemIds,
      extraItemIds,
      draggingItems,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const ref = useRef<HTMLDivElement>(null)

    useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement)

    const timer = useRef<NodeJS.Timeout>(null)

    const { json } = useJsonStore()
    const { itemAreas } = useItemAreaStore()
    const { setDraggingItemId } = useDraggingItemStore()

    const [isHovering, setIsHovering] = useState<boolean>(false)
    const [onRight, setOnRight] = useState<boolean>(false)
    const [onLeft, setOnLeft] = useState<boolean>(false)

    const itemType = (itemId: string) => {
      const item = JSONUtil.getByPath(json, itemId)

      if (Array.isArray(item)) return 'array'
      else if (typeof item === 'object' && item !== null) return 'object'
      return 'value'
    }

    const parentType: Data['type'] = itemType(item.parentPath)

    const isSelected =
      selectedItemIds?.[item.id] ||
      extraItemIds?.[item.id] ||
      draggingItems?.[item.id]

    const truncate = (title: string) => {
      const len = 9
      if (title.length > len) return title.substring(0, len) + '..'
      return title
    }

    const [{ isDragging }, drag] = useDrag(() => ({
      type: DRAG_ITEM.CARD,
      item: () => ({ ...item, index }),
      canDrag(monitor) {
        if (!ref.current) return false

        const hoverRect = ref.current.getBoundingClientRect()
        const clientOffset = monitor.getClientOffset()

        const hoverClientX = (clientOffset as XYCoord).x - hoverRect.left
        const hoverClientY = (clientOffset as XYCoord).y - hoverRect.top

        if (
          hoverClientX < ITEM.GAP_SIZE ||
          hoverClientX > ITEM.SIZE + ITEM.GAP_SIZE ||
          hoverClientY < ITEM.GAP_SIZE ||
          hoverClientY > ITEM.SIZE + ITEM.GAP_SIZE
        ) {
          return false
        }

        return true
      },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end(_, monitor) {
        if (monitor.didDrop() && onDropEnd) onDropEnd()
      },
    }))

    const [{ handlerId }, drop] = useDrop<
      DragItem,
      void,
      { handlerId: Identifier | null }
    >({
      accept: DRAG_ITEM.CARD,
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
        }, 100)

        const dragIndex = item.index
        const hoverIndex = index

        if (dragIndex === hoverIndex) return

        const hoverRect = ref.current.getBoundingClientRect()
        const clientOffset = monitor.getClientOffset()

        const hoverClientX = (clientOffset as XYCoord).x - hoverRect.left
        const hoverMiddleX = (hoverRect.right - hoverRect.left) / 2

        const width = hoverRect.width
        const offset = ITEM.GAP_SIZE * 1.5

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
        const containerDiv = ref.current?.parentElement
        const sourceOffset = monitor.getInitialSourceClientOffset()
        const dropPoint = monitor.getClientOffset()

        if (!containerDiv || !sourceOffset || !dropPoint) return

        const containerRect = containerDiv.getBoundingClientRect()

        const sourceX = sourceOffset.x - containerRect.x + ITEM.GAP_SIZE
        const sourceY = sourceOffset.y - containerRect.y + ITEM.GAP_SIZE
        const sourcePoint = new DOMRect(sourceX, sourceY, 0, 0)
        const source = DOMUtil.getItem(sourcePoint, itemAreas)

        const targetX = dropPoint.x - containerRect.x
        const targetY = dropPoint.y - containerRect.y
        const targetPoint = new DOMRect(targetX, targetY, 0, 0)
        const target = DOMUtil.getItem(
          targetPoint,
          itemAreas,
          -ITEM.GAP_SIZE,
          -ITEM.GAP_SIZE,
        )

        if (source == null || target == null) return

        const targetType = JSONUtil.getItemType(json, target.id)

        const sourceWrapper = DOMUtil.getNthChild(containerDiv, source.index)
        const targetWrapper = DOMUtil.getNthChild(containerDiv, target.index)
        const sourceDiv = sourceWrapper?.firstElementChild as HTMLDivElement
        const targetDiv = targetWrapper?.firstElementChild as HTMLDivElement

        setOnLeft(false)
        setOnRight(false)

        if (parentType === 'array' && (onLeft || onRight)) {
          if (onRight) target.index += 1
          if (onItemRelocation) onItemRelocation(target.index)
          return
        }
        if (targetType === 'value') return
        if (!sourceDiv || !targetDiv || source.id === target.id) return

        if (onItemMove) onItemMove(sourceDiv, targetDiv)
      },
    })

    useEffect(() => {
      if (isDragging) setDraggingItemId(item.id)
      else setDraggingItemId(null)
    }, [isDragging, item.id, setDraggingItemId])

    useEffect(() => {
      if (!isHovering && (onLeft || onRight)) {
        setOnLeft(false)
        setOnRight(false)
      }
    }, [isHovering, onLeft, onRight])

    drag(drop(ref))

    return (
      <div
        ref={ref}
        key={item.id}
        data-handler-id={handlerId}
        style={{
          ...style,
          width: ITEM.SIZE + ITEM.GAP_SIZE * 2,
          height: ITEM.SIZE + ITEM.GAP_SIZE * 2,
          padding: `${ITEM.GAP_SIZE}px`,
        }}
      >
        <Card
          data-item={item.id}
          data-index={index}
          data-type={item.type}
          data-item-type={item.type}
          className="cursor-pointer"
          style={{
            width: '100%',
            height: '100%',
            opacity: isDragging ? 0.2 : 1,
            backgroundColor: isSelected ? 'black' : 'white',
            color: isSelected ? 'white' : 'black',
            boxShadow: onLeft
              ? '-20px 0px 5px -2px rgba(20,75,222,0.5)'
              : onRight
                ? '20px 0px 5px -2px rgba(20,75,222,0.5)'
                : undefined,
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
            <div className="truncate">
              {JSON.stringify(item.value, null, 1)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  },
)

export default GridCard
