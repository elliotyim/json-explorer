import { MOUSE_CLICK } from '@/constants/mouse'
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
  containerRef,
  scrollRef = containerRef,
  onSelectionStart,
  onSelectionChange,
  onSelectionEnd,
}) => {
  const selectionRef = useRef<HTMLDivElement>(null)

  const [dragVector, setDragVector] = useState<DOMVector | null>(null)
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null)
  const [, setIsAreaDragging] = useState<boolean>(false)

  const selectionArea = dragVector?.toDOMRect()

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const container = containerRef?.current
      if (!container || !dragVector || !scrollVector) return

      const prevX = dragVector.x
      const prevY = dragVector.y
      const { x, y } = DOMUtil.getCurrentPoint(container, event)

      const nextDragVector = new DOMVector(prevX, prevY, x - prevX, y - prevY)

      if (nextDragVector.getDiagonalLength() < 10) return

      setIsAreaDragging(true)
      setDragVector(nextDragVector)

      const selectionArea = nextDragVector.add(scrollVector).toDOMRect()

      if (onSelectionChange) {
        const handle = requestAnimationFrame(() => {
          onSelectionChange({ event, selectionArea })
          cancelAnimationFrame(handle)
        })
      }
    },
    [containerRef, dragVector, onSelectionChange, scrollVector],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const container = containerRef?.current
      if (!container || !scrollRef?.current) return

      const { x, y } = DOMUtil.getCurrentPoint(container, e)
      const scrollX = scrollRef.current.scrollLeft
      const scrollY = scrollRef.current.scrollTop

      let selectionArea
      if (dragVector && scrollVector) {
        selectionArea = dragVector.add(scrollVector).toDOMRect()
      } else {
        selectionArea = new DOMRect(x + scrollX, y + scrollY, 0, 0)
      }

      if (onSelectionEnd) {
        onSelectionEnd({ event: e, selectionArea })
      }

      setDragVector(null)
      setScrollVector(null)
      setIsAreaDragging(false)
    },
    [containerRef, dragVector, onSelectionEnd, scrollRef, scrollVector],
  )

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      const container = containerRef?.current
      if (e.button !== MOUSE_CLICK.LEFT || !container || !scrollRef?.current) {
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
        if (shouldStop) return
      }

      setDragVector(new DOMVector(x, y, 0, 0))
      setScrollVector(new DOMVector(scrollX, scrollY, 0, 0))
    },
    [containerRef, onSelectionStart, scrollRef],
  )

  const onScroll = useCallback(
    (e: Event) => {
      let width = 0,
        height = 0
      const scrollX = (e.currentTarget as HTMLElement).scrollLeft
      const scrollY = (e.currentTarget as HTMLElement).scrollTop

      if (dragVector && scrollVector) {
        width = scrollX - scrollVector.x
        height = scrollY - scrollVector.y
      }

      setScrollVector(new DOMVector(scrollX, scrollY, width, height))
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

  return (
    <div
      ref={selectionRef}
      className={'invisible absolute border-2 border-black bg-black/30'}
      style={{
        top: selectionArea?.y,
        left: selectionArea?.x,
        width: selectionArea?.width,
        height: selectionArea?.height,
        visibility: selectionArea != null ? 'visible' : 'hidden',
      }}
    />
  )
}

export default DragSelection
