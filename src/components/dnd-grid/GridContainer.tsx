import { NodeModel } from '@minoru/react-dnd-treeview'
import GridCard from './GridCard'
import { useRef, useState } from 'react'
import { DOMVector } from '@/utils/dom'
import { cn } from '@/lib/utils'

interface Props {
  items: NodeModel<CustomData>[]
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  ...props
}) => {
  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const selectionRect = dragVector && isDragging ? dragVector.toDOMRect() : null

  const intersect = (rect1: DOMRect, rect2: DOMRect) => {
    if (rect1.right < rect2.left || rect2.right < rect1.left) return false
    if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) return false
    return true
  }

  const updateSelectedItems = (dragVector: DOMVector) => {
    const next: Record<string, boolean> = {}
    const containerRect = containerRef.current?.getBoundingClientRect()

    containerRef.current?.querySelectorAll('[data-item]').forEach((el) => {
      if (
        containerRect == null ||
        containerRef.current == null ||
        !(el instanceof HTMLElement)
      ) {
        return
      }

      const itemRect = el.getBoundingClientRect()
      const x = itemRect.x - containerRect.x
      const y = itemRect.y - containerRect.y
      const translatedItemRect = new DOMRect(
        x,
        y,
        itemRect.width,
        itemRect.height,
      )

      if (!intersect(dragVector.toDOMRect(), translatedItemRect)) return

      if (el.dataset.item && typeof el.dataset.item === 'string') {
        next[el.dataset.item] = true
      }
    })

    setSelectedItems(next)
  }

  return (
    <div
      ref={containerRef}
      className="relative z-0 flex h-full flex-wrap gap-4 p-4"
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

        // e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (dragVector == null) return

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
        updateSelectedItems(nextDragVector)
      }}
      onPointerUp={() => {
        if (!isDragging) {
          setSelectedItems({})
          setDragVector(null)
        } else {
          setDragVector(null)
          setIsDragging(false)
        }
      }}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setSelectedItems({})
          setDragVector(null)
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
