import { NodeModel } from '@minoru/react-dnd-treeview'
import GridCard from './GridCard'
import { useEffect, useRef, useState } from 'react'
import { DOMVector } from '@/utils/dom'
import { cn } from '@/lib/utils'

interface Props {
  items: NodeModel<CustomData>[]
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  )
  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const selectionRect =
    dragVector && scrollVector && containerRef.current && isDragging
      ? dragVector
          .add(scrollVector)
          .clamp(
            new DOMRect(
              0,
              0,
              containerRef.current.scrollWidth,
              containerRef.current.scrollHeight,
            ),
          )
          .toDOMRect()
      : null

  const intersect = (rect1: DOMRect, rect2: DOMRect) => {
    if (rect1.right < rect2.left || rect2.right < rect1.left) return false
    if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) return false
    return true
  }

  const updateSelectedItems = (
    dragVector: DOMVector,
    scrollVector: DOMVector,
  ) => {
    const next: Record<string, boolean> = {}
    const containerRect = containerRef.current?.getBoundingClientRect()

    containerRef.current?.childNodes.forEach((el) => {
      if (
        containerRect == null ||
        containerRef.current == null ||
        !(el instanceof HTMLElement)
      ) {
        return
      }

      const itemRect = el.getBoundingClientRect()
      const x = itemRect.x - containerRect.x + containerRef.current.scrollLeft
      const y = itemRect.y - containerRect.y + containerRef.current.scrollTop
      const translatedItemRect = new DOMRect(
        x,
        y,
        itemRect.width,
        itemRect.height,
      )

      if (
        !intersect(dragVector.add(scrollVector).toDOMRect(), translatedItemRect)
      )
        return

      if (el.dataset.item && typeof el.dataset.item === 'string') {
        next[el.dataset.item] = true
      }
    })

    setSelectedItems(next)
  }

  useEffect(() => {
    if (!isDragging) return

    let handle = requestAnimationFrame(scrollTheLad)

    return () => cancelAnimationFrame(handle)

    function clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max)
    }

    function scrollTheLad() {
      if (containerRef.current == null || dragVector == null) return

      const currentPointer = dragVector.toTerminalPoint()
      const containerRect = containerRef.current.getBoundingClientRect()

      const shouldScrollRight = containerRect.width - currentPointer.x < 20
      const shouldScrollLeft = currentPointer.x < 20
      const shouldScrollDown = containerRect.height - currentPointer.y < 20
      const shouldScrollUp = currentPointer.y < 20

      const left = shouldScrollRight
        ? clamp(20 - containerRect.width + currentPointer.x, 0, 15)
        : shouldScrollLeft
          ? -1 * clamp(20 - currentPointer.x, 0, 15)
          : undefined
      const top = shouldScrollDown
        ? clamp(20 - containerRect.height + currentPointer.y, 0, 15)
        : shouldScrollUp
          ? -1 * clamp(20 - currentPointer.y, 0, 15)
          : undefined

      if (top === undefined && left === undefined) {
        handle = requestAnimationFrame(scrollTheLad)
        return
      }

      containerRef.current.scrollBy({ left, top })

      handle = requestAnimationFrame(scrollTheLad)
    }
  }, [dragVector, isDragging])

  return (
    <div
      ref={containerRef}
      className="relative z-0 grid h-full grid-cols-[repeat(auto-fill,minmax(150px,auto))] gap-4 overflow-auto p-4"
      onPointerDown={(e) => {
        if (e.button !== 0) return

        const containerRect = e.currentTarget.getBoundingClientRect()

        setDragVector(
          new DOMVector(
            e.clientX - containerRect.x,
            e.clientY - containerRect.y,
            0,
            0,
          ),
        )

        setScrollVector(
          new DOMVector(
            e.currentTarget.scrollLeft,
            e.currentTarget.scrollTop,
            0,
            0,
          ),
        )
      }}
      onPointerMove={(e) => {
        if (dragVector == null || scrollVector == null) return

        const containerRect = e.currentTarget.getBoundingClientRect()

        const nextDragVector = new DOMVector(
          dragVector.x,
          dragVector.y,
          e.clientX - containerRect.x - dragVector.x,
          e.clientY - containerRect.y - dragVector.y,
        )

        if (!isDragging && nextDragVector.getDiagonalLength() < 10) return
        setIsDragging(true)

        containerRef.current?.focus()

        setDragVector(nextDragVector)
        updateSelectedItems(nextDragVector, scrollVector)
      }}
      onPointerUp={() => {
        if (!isDragging) {
          setSelectedItems({})
          setDragVector(null)
        } else {
          setDragVector(null)
          setIsDragging(false)
        }
        setScrollVector(null)
      }}
      onScroll={(e) => {
        if (dragVector == null || scrollVector == null) return

        const { scrollLeft, scrollTop } = e.currentTarget

        const nextScrollVector = new DOMVector(
          scrollVector.x,
          scrollVector.y,
          scrollLeft - scrollVector.x,
          scrollTop - scrollVector.y,
        )

        setScrollVector(nextScrollVector)
        updateSelectedItems(dragVector, nextScrollVector)
      }}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setSelectedItems({})
          setDragVector(null)
          setScrollVector(null)
        }
      }}
      {...props}
    >
      {items.map((item) => (
        <GridCard
          key={item.id}
          item={item}
          data-item={item.id}
          data-item-type={item.data?.type}
          className={cn(
            'h-[150px] w-[150px] cursor-pointer select-none',
            selectedItems[item.id]
              ? 'bg-black text-white'
              : 'bg-white text-black',
          )}
          onClick={() => console.log(item.id)}
        />
      ))}
      {selectionRect && (
        <div
          className={'absolute border-2 border-black bg-black/30'}
          style={{
            top: selectionRect.y,
            left: selectionRect.x,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
    </div>
  )
}

export default GridContainer
