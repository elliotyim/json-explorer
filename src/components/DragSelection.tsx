import { MOUSE_CLICK } from '@/constants/mouse'
import { useAutoScroll } from '@/hooks/useScrollTheLad'
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
  isReady: boolean
  enabled: boolean
  containerRef: React.RefObject<HTMLDivElement | null> | null
  scrollRef?: React.RefObject<HTMLDivElement | null> | null
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
  isReady,
  enabled,
  containerRef,
  scrollRef = containerRef,
  onSelectionStart,
  onSelectionChange,
  onSelectionEnd,
}) => {
  const selectionRef = useRef<HTMLDivElement>(null)

  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null)
  const [isAreaDragging, setIsAreaDragging] = useState<boolean>(false)

  const selectionAreaRef = useRef<DOMRect>(null)

  const clearAll = useCallback(() => {
    document.body.style.removeProperty('user-select')
    setDragVector(null)
    setScrollVector(null)
    setIsAreaDragging(false)
    selectionAreaRef.current = null
  }, [])

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const container = containerRef?.current
      const scroller = scrollRef?.current
      if (!container || !scroller || !dragVector || !scrollVector || !enabled) {
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

      const { scrollLeft, scrollTop } = scroller

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
      containerRef,
      dragVector,
      enabled,
      onSelectionChange,
      scrollRef,
      scrollVector,
    ],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const container = containerRef?.current
      if (!container || !scrollRef?.current || !enabled) return

      const { x, y } = DOMUtil.getCurrentPoint(container, e)
      const scrollX = scrollRef.current.scrollLeft
      const scrollY = scrollRef.current.scrollTop

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
      containerRef,
      dragVector,
      enabled,
      onSelectionEnd,
      scrollRef,
      scrollVector,
    ],
  )

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      const container = containerRef?.current
      if (
        e.button !== MOUSE_CLICK.LEFT ||
        !container ||
        !scrollRef?.current ||
        !enabled
      ) {
        return
      }

      const { x, y } = DOMUtil.getCurrentPoint(container, e)
      const scrollX = scrollRef.current.scrollLeft
      const scrollY = scrollRef.current.scrollTop

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
    [clearAll, containerRef, enabled, onSelectionStart, scrollRef],
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
    const container = containerRef?.current
    const scrollContainer = scrollRef?.current

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
    isReady,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onScroll,
    scrollRef,
  ])

  useAutoScroll({
    containerRef,
    scrollRef,
    isDragging: isAreaDragging,
    dragVector,
  })

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
