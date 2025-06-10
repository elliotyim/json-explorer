import { useAreaDraggingStore } from '@/store/dragging'
import { DOMVector } from '@/utils/dom'
import { useEffect } from 'react'

interface Props {
  container: HTMLElement | null
  scrollContainer: HTMLElement | null
  dragVector: DOMVector | null
}

export const useAutoScroll = ({
  container,
  scrollContainer,
  dragVector,
}: Props) => {
  const { isAreaDraggingRef } = useAreaDraggingStore()

  useEffect(() => {
    if (!isAreaDraggingRef.current) return

    let handle = requestAnimationFrame(scrollTheLad)

    return () => cancelAnimationFrame(handle)

    function clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max)
    }

    function scrollTheLad() {
      if (!container || !scrollContainer || !dragVector) return

      const currentPointer = dragVector.toTerminalPoint()
      const containerRect = container.getBoundingClientRect()

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

      scrollContainer?.scrollBy({ top })

      handle = requestAnimationFrame(scrollTheLad)
    }
  }, [container, dragVector, isAreaDraggingRef, scrollContainer])
}
