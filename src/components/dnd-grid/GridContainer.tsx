import { cn } from '@/lib/utils'
import { DOMUtil, DOMVector } from '@/utils/dom'
import { DndProvider, NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useRef, useState } from 'react'
import { HTML5Backend } from 'react-dnd-html5-backend'
import GridCard from './GridCard'

interface Props {
  items: NodeModel<CustomData>[]
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    relativeIndex?: number,
  ) => void
}

const GridContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  items,
  onItemMove,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  )
  const [extraSelectedItems, setExtraSelectedItems] = useState<
    Record<string, boolean>
  >({})

  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null)

  const [isItemDragging, setIsItemDragging] = useState<boolean>(false)
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

  const selectItemDiv = (
    div: HTMLElement,
    prev: Record<string, boolean> = {},
  ) => {
    const id = div.dataset.item
    if (id && typeof id === 'string') setSelectedItems({ ...prev, [id]: true })
  }

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
        onPointerDown={(e) => {
          if (e.button !== 0 || !containerRef.current) return

          const containerRect = e.currentTarget.getBoundingClientRect()

          const x = e.clientX - containerRect.x
          const y = e.clientY - containerRect.y
          const containerDiv = containerRef.current

          const itemUnderPointer = DOMUtil.getDivOnPointer(x, y, containerDiv)
          if (itemUnderPointer != null) {
            // dnd
            // 0. if the item under the pointer is not in selectedItems, put it into the selectedItems
            // 1. if parent is a list
            // - can move for reordering
            // - can move into other folders
            // 2. if parent is not a list
            // - can move into other folders
            // const items = getSelctedItems(new DOMRect(x, y, 0, 0))
            // setSelectedItems({ ...selectedItems, ...items })
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

          if (pushedKeys['Control']) setExtraSelectedItems(items)
          else setSelectedItems(items)
        }}
        onPointerUp={() => {
          if (!isAreaDragging) {
            if (!pushedKeys['Control']) {
              setSelectedItems({})
              setExtraSelectedItems({})
            }
            setDragVector(null)
          } else {
            setDragVector(null)
            setIsAreaDragging(false)

            if (Object.keys(extraSelectedItems).length) {
              setSelectedItems({ ...selectedItems, ...extraSelectedItems })
              setExtraSelectedItems({})
            }
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

          if (pushedKeys['Control']) setExtraSelectedItems(items)
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
            onItemMove={onItemMove}
            className={cn(
              'h-[150px] w-[150px] cursor-pointer select-none',
              selectedItems[item.id] || extraSelectedItems[item.id]
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
    </DndProvider>
  )
}

export default GridContainer
