import { cn } from '@/lib/utils'
import { DOMUtil, DOMVector } from '@/utils/dom'
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useRef, useState } from 'react'
import GridCard from './GridCard'

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
  const [pushedKeys, setPushedKeys] = useState<Record<string, boolean>>({})

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

  const selectItemDiv = (
    div: HTMLElement,
    prev: Record<string, boolean> = {},
  ) => {
    const id = div.dataset.item
    if (id && typeof id === 'string') setSelectedItems({ ...prev, [id]: true })
  }

  const getSelctedItems = (
    dragVector: DOMVector,
    scrollVector: DOMVector,
  ): Record<string, boolean> => {
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

      const selectedArea = dragVector.add(scrollVector).toDOMRect()
      const childRect = DOMUtil.generateChildRect(
        containerRect,
        el,
        containerRef.current.scrollLeft,
        containerRef.current.scrollTop,
      )
      if (!DOMUtil.intersect(selectedArea, childRect)) return

      const itemId = el.dataset.item
      if (itemId && typeof itemId === 'string') next[itemId] = true
    })

    return next
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

        const x = e.clientX - containerRect.x
        const y = e.clientY - containerRect.y
        setDragVector(new DOMVector(x, y, 0, 0))

        const scrollX = e.currentTarget.scrollLeft
        const scrollY = e.currentTarget.scrollTop
        setScrollVector(new DOMVector(scrollX, scrollY, 0, 0))
      }}
      onPointerMove={(e) => {
        if (dragVector == null || scrollVector == null) return

        const containerRect = e.currentTarget.getBoundingClientRect()

        const prevX = dragVector.x
        const prevY = dragVector.y
        const x = e.clientX - containerRect.x
        const y = e.clientY - containerRect.y
        const nextDragVector = new DOMVector(prevX, prevY, x - prevX, y - prevY)

        if (!isDragging && nextDragVector.getDiagonalLength() < 10) return

        containerRef.current?.focus()

        setIsDragging(true)
        setDragVector(nextDragVector)

        const prev = pushedKeys['Control'] ? selectedItems : {}
        const next = getSelctedItems(nextDragVector, scrollVector)
        setSelectedItems({ ...prev, ...next })
      }}
      onPointerUp={() => {
        if (!isDragging) {
          if (!pushedKeys['Control']) setSelectedItems({})
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
        getSelctedItems(dragVector, nextScrollVector)
      }}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setSelectedItems({})
          setDragVector(null)
          setScrollVector(null)
        } else if (!pushedKeys[e.key]) {
          setPushedKeys((prev) => ({ ...prev, [e.key]: true }))
        }
      }}
      onKeyUp={(e) => {
        delete pushedKeys[e.key]
        setPushedKeys({ ...pushedKeys })
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
          onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const id = e.currentTarget.dataset.item
            const prev = pushedKeys['Control'] ? selectedItems : {}

            if (id && typeof id === 'string' && prev[id]) {
              delete prev[id]
              setSelectedItems({ ...prev })
            } else {
              selectItemDiv(e.currentTarget, prev)
            }
          }}
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
