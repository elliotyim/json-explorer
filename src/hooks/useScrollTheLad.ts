import { DOMVector } from '@/utils/dom'
import { useEffect } from 'react'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null> | null
  scrollRef: React.RefObject<HTMLDivElement | null> | null
  dragVector: DOMVector | null
  isDragging: boolean
}

export const useAutoScroll = ({
  containerRef,
  scrollRef,
  dragVector,
  isDragging,
}: Props) => {
  useEffect(() => {
    if (!isDragging) return

    let handle = requestAnimationFrame(scrollTheLad)

    return () => cancelAnimationFrame(handle)

    function clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max)
    }

    function scrollTheLad() {
      if (!containerRef?.current || !scrollRef?.current || !dragVector) return

      const currentPointer = dragVector.toTerminalPoint()
      const containerRect = containerRef.current.getBoundingClientRect()

      const offset = 100

      const shouldScrollRight = containerRect.width - currentPointer.x < offset
      const shouldScrollLeft = currentPointer.x < offset
      const shouldScrollDown = containerRect.height - currentPointer.y < offset
      const shouldScrollUp = currentPointer.y < offset

      let left
      if (shouldScrollRight) {
        left = clamp(offset - containerRect.width + currentPointer.x, 0, 15)
      } else if (shouldScrollLeft) {
        left = -1 * clamp(offset - currentPointer.x, 0, 15)
      } else {
        left = undefined
      }

      let top
      if (shouldScrollDown) {
        top = clamp(offset - containerRect.height + currentPointer.y, 0, 15)
      } else if (shouldScrollUp) {
        top = -1 * clamp(offset - currentPointer.y, 0, 15)
      } else {
        top = undefined
      }

      if (top === undefined && left === undefined) {
        handle = requestAnimationFrame(scrollTheLad)
        return
      }

      scrollRef?.current?.scrollBy({ left, top })

      handle = requestAnimationFrame(scrollTheLad)
    }
  }, [containerRef, dragVector, isDragging, scrollRef])
}
