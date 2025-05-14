import { cn } from '@/lib/utils'
import { DOMUtil, DOMVector } from '@/utils/dom'
import { DndProvider, NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useRef, useState } from 'react'
import { HTML5Backend } from 'react-dnd-html5-backend'
import GridCard from './GridCard'

interface Props {
  items: NodeModel<CustomData>[]
  selectedItemId: string
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: NodeModel<CustomData>[],
    relativeIndex?: number,
  ) => void
  onItemEnter?: (itemId: string) => void
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  selectedItemId,
  onItemMove,
  onItemEnter,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  )
  const [extraItems, setExtraItems] = useState<Record<string, boolean>>({})

  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null)

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [isAreaDragging, setIsAreaDragging] = useState<boolean>(false)
  const [pushedKeys, setPushedKeys] = useState<Record<string, boolean>>({})

  const selectionRect =
    dragVector && scrollVector && containerRef.current && isAreaDragging
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

  const getSelctedItems = (selectedArea: DOMRect): Record<string, boolean> => {
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

  const handleItemMove = (
    source: HTMLElement,
    target: HTMLElement,
    relativeIndex?: number,
  ) => {
    if (onItemMove) {
      const selectedNodes = items.filter(
        (item) => selectedItems[item.id] || extraItems[item.id],
      )
      onItemMove(source, target, selectedNodes, relativeIndex)
      setSelectedItems({})
      setExtraItems({})
    }
  }

  useEffect(() => {
    setSelectedItems({})
    setExtraItems({})
  }, [selectedItemId])

  useEffect(() => {
    if (!isAreaDragging) return

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
  }, [dragVector, isAreaDragging])

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={containerRef}
        className="relative z-0 grid h-full grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 overflow-auto p-4"
        onClick={(e) => {
          if (e.detail === 2) {
            const containerRect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - containerRect.x
            const y = e.clientY - containerRect.y
            const containerDiv = containerRef.current!

            const itemUnderPointer = DOMUtil.getDivOnPointer(x, y, containerDiv)
            const itemId = itemUnderPointer?.dataset.item

            if (onItemEnter && itemId) onItemEnter(itemId)
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 || !containerRef.current) return

          const containerRect = e.currentTarget.getBoundingClientRect()

          const x = e.clientX - containerRect.x
          const y = e.clientY - containerRect.y
          const containerDiv = containerRef.current

          const itemUnderPointer = DOMUtil.getDivOnPointer(x, y, containerDiv)
          const itemId = itemUnderPointer?.dataset.item

          if (itemUnderPointer != null && itemId != null) {
            const newItem = { [itemId]: true }
            if (e.ctrlKey) setExtraItems((prev) => ({ ...prev, ...newItem }))
            else setExtraItems({ ...newItem })
            return
          }

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
          const nextDragVector = new DOMVector(
            prevX,
            prevY,
            x - prevX,
            y - prevY,
          )

          if (!isAreaDragging && nextDragVector.getDiagonalLength() < 10) return

          containerRef.current?.focus()

          setIsAreaDragging(true)
          setDragVector(nextDragVector)

          const selectedArea = nextDragVector.add(scrollVector).toDOMRect()
          const items = getSelctedItems(selectedArea)

          if (e.ctrlKey) setExtraItems(items)
          else setSelectedItems(items)
        }}
        onPointerUp={(e) => {
          if (!isAreaDragging) {
            const containerRect = e.currentTarget.getBoundingClientRect()

            const x = e.clientX - containerRect.x
            const y = e.clientY - containerRect.y
            const containerDiv = containerRef.current!

            const itemUnderPointer = DOMUtil.getDivOnPointer(x, y, containerDiv)
            const itemId = itemUnderPointer?.dataset.item

            if (itemUnderPointer && itemId != null) {
              const newItem = { [itemId]: true }

              if (draggingItemId == null) {
                if (selectedItems[itemId]) {
                  if (e.ctrlKey) {
                    delete extraItems[itemId]
                    delete selectedItems[itemId]
                    setExtraItems({ ...extraItems })
                    setSelectedItems({ ...selectedItems })
                  } else {
                    setExtraItems({})
                    setSelectedItems(newItem)
                  }
                } else if (!e.ctrlKey) {
                  setExtraItems({})
                  setSelectedItems(newItem)
                }
              }
            } else if (!e.ctrlKey) {
              setExtraItems({})
              setSelectedItems({})
            }

            setDragVector(null)
          } else {
            setDragVector(null)
            setIsAreaDragging(false)
          }

          if (Object.keys(extraItems).length) {
            setSelectedItems((prev) => ({ ...prev, ...extraItems }))
            setExtraItems({})
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

          const selectedArea = dragVector.add(nextScrollVector).toDOMRect()
          const items = getSelctedItems(selectedArea)

          if (pushedKeys['Control']) setExtraItems(items)
          else setSelectedItems(items)
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
        {items.map((item, index) => (
          <GridCard
            key={item.id}
            item={item}
            index={index}
            data-item={item.id}
            data-item-type={item.data?.type}
            onItemMove={handleItemMove}
            setDraggingItemId={setDraggingItemId}
            className={cn(
              'h-[150px] w-[150px] cursor-pointer select-none',
              selectedItems[item.id] || extraItems[item.id]
                ? 'bg-black text-white'
                : 'bg-white text-black',
            )}
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
    </DndProvider>
  )
}

export default GridContainer
