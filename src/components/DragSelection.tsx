import { MOUSE_CLICK } from '@/constants/mouse'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { useAreaDraggingStore } from '@/store/dragging'
import { DOMUtil, DOMVector } from '@/utils/dom'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface SelectionStartProps {
  event: PointerEvent
  x: number
  y: number
  scrollX: number
  scrollY: number
}

interface SelectionChangeProps {
  event: PointerEvent
  selectionArea: DOMRect
}

interface SelectionEndProps {
  event: PointerEvent
  selectionArea: DOMRect
}

interface Props {
  isContainerReady: boolean
  enabled: boolean
  container: HTMLElement | null
  scrollContainer?: HTMLElement | null
  onSelectionStart?: ({
    event,
    x,
    y,
    scrollX,
    scrollY,
  }: SelectionStartProps) => boolean
  onSelectionChange?: ({ event, selectionArea }: SelectionChangeProps) => void
  onSelectionEnd?: ({ event, selectionArea }: SelectionEndProps) => void
}

const DragSelection: React.FC<Props> = ({
  isContainerReady,
  enabled,
  container: container,
  scrollContainer = container,
  onSelectionStart,
  onSelectionChange,
  onSelectionEnd,
}) => {
  const selectionRef = useRef<HTMLDivElement>(null)

  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null)
  const { isAreaDragging, setIsAreaDragging } = useAreaDraggingStore()

  const selectionAreaRef = useRef<DOMRect>(null)

  const clearAll = useCallback(() => {
    document.body.style.removeProperty('user-select')
    setDragVector(null)
    setScrollVector(null)
    setIsAreaDragging(false)
    selectionAreaRef.current = null
  }, [setIsAreaDragging])

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (
        !container ||
        !scrollContainer ||
        !dragVector ||
        !scrollVector ||
        !enabled
      ) {
        return
      }

      const prevX = dragVector.x
      const prevY = dragVector.y
      const { x, y } = DOMUtil.getCurrentPoint(container, event)

      const nextDragVector = new DOMVector(prevX, prevY, x - prevX, y - prevY)

      if (nextDragVector.getDiagonalLength() < 10) return

      setIsAreaDragging(true)
      setDragVector(nextDragVector)

      const selectionArea = nextDragVector.add(scrollVector).toDOMRect()

      const { scrollLeft, scrollTop } = scrollContainer

      const visualArea = new DOMRect(
        selectionArea.x - scrollLeft,
        selectionArea.y - scrollTop,
        selectionArea.width,
        selectionArea.height,
      )

      if (onSelectionChange) {
        const handle = requestAnimationFrame(() => {
          selectionAreaRef.current = visualArea
          onSelectionChange({ event, selectionArea })
          cancelAnimationFrame(handle)
        })
      }
    },
    [
      container,
      dragVector,
      enabled,
      onSelectionChange,
      scrollContainer,
      scrollVector,
      setIsAreaDragging,
    ],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!container || !scrollContainer || !enabled) return

      const { x, y } = DOMUtil.getCurrentPoint(container, e)
      const scrollX = scrollContainer.scrollLeft
      const scrollY = scrollContainer.scrollTop

      let selectionArea
      if (dragVector && scrollVector) {
        selectionArea = dragVector.add(scrollVector).toDOMRect()
      } else {
        selectionArea = new DOMRect(x + scrollX, y + scrollY, 0, 0)
      }

      clearAll()

      if (onSelectionEnd) onSelectionEnd({ event: e, selectionArea })
    },
    [
      clearAll,
      container,
      dragVector,
      enabled,
      onSelectionEnd,
      scrollContainer,
      scrollVector,
    ],
  )

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (
        e.button !== MOUSE_CLICK.LEFT ||
        !container ||
        !scrollContainer ||
        !enabled
      ) {
        return
      }

      const { x, y } = DOMUtil.getCurrentPoint(container, e)
      const scrollX = scrollContainer.scrollLeft
      const scrollY = scrollContainer.scrollTop

      if (onSelectionStart) {
        const shouldStop = onSelectionStart({
          event: e,
          x,
          y,
          scrollX,
          scrollY,
        })
        if (shouldStop) return clearAll()
      }

      const nextDragVector = new DOMVector(x, y, 0, 0)
      const nextScrollVector = new DOMVector(scrollX, scrollY, 0, 0)

      setDragVector(nextDragVector)
      setScrollVector(nextScrollVector)

      selectionAreaRef.current = nextDragVector
        .add(nextScrollVector)
        .toDOMRect()

      document.body.style.userSelect = 'none'
    },
    [clearAll, container, enabled, onSelectionStart, scrollContainer],
  )

  const onScroll = useCallback(
    (e: Event) => {
      const scroller = e.currentTarget as HTMLElement
      if (!dragVector || !scrollVector) return

      const scrollLeft = scroller.scrollLeft
      const scrollTop = scroller.scrollTop

      const scrollX = scrollVector.x
      const scrollY = scrollVector.y

      const nextScrollVector = new DOMVector(
        scrollX,
        scrollY,
        scrollLeft - scrollX,
        scrollTop - scrollY,
      )

      const logicalArea = dragVector.add(nextScrollVector).toDOMRect()

      const visualArea = new DOMRect(
        logicalArea.x - scrollLeft,
        logicalArea.y - scrollTop,
        logicalArea.width,
        logicalArea.height,
      )

      selectionAreaRef.current = visualArea
      setScrollVector(nextScrollVector)
    },
    [dragVector, scrollVector],
  )

  useEffect(() => {
    if (!container || !scrollContainer) return

    container.onpointerdown = onPointerDown
    container.onpointermove = onPointerMove
    window.onpointerup = onPointerUp
    scrollContainer.onscroll = onScroll

    return () => {
      if (!container || !scrollContainer) return

      container.onpointerdown = null
      container.onpointermove = null
      window.onpointerup = null
      scrollContainer.onscroll = null
    }
  }, [
    isContainerReady,
    container,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onScroll,
    scrollContainer,
  ])

  useAutoScroll({ container, scrollContainer, isAreaDragging, dragVector })

  return (
    <div
      ref={selectionRef}
      className={'absolute border-2 border-black bg-black/30'}
      style={{
        top: selectionAreaRef.current?.y,
        left: selectionAreaRef.current?.x,
        width: selectionAreaRef.current?.width,
        height: selectionAreaRef.current?.height,
        visibility: isAreaDragging ? 'visible' : 'hidden',
      }}
    />
  )
}

export default DragSelection
