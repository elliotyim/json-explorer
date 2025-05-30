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

      const shouldScrollDown = containerRect.height - currentPointer.y < offset
      const shouldScrollUp = currentPointer.y < offset

      let top
      if (shouldScrollDown) {
        top = clamp(offset - containerRect.height + currentPointer.y, 0, 15)
      } else if (shouldScrollUp) {
        top = -1 * clamp(offset - currentPointer.y, 0, 15)
      } else {
        top = undefined
      }

      if (top === undefined) {
        handle = requestAnimationFrame(scrollTheLad)
        return
      }

      scrollRef?.current?.scrollBy({ top })

      handle = requestAnimationFrame(scrollTheLad)
    }
  }, [containerRef, dragVector, isDragging, scrollRef])
}
