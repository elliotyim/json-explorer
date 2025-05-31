import { useBackHistoryStore, useForwardHistoryStore } from '@/store/history'
import { useCurrentItemStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'

interface ReturnProps {
  goBackward: () => void
  goForward: () => void
  goPrev: () => void
}

export const useHistory = (): ReturnProps => {
  const { json } = useJsonStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()

  const { backHistories, setBackHistories } = useBackHistoryStore()
  const { forwardHistories, setForwardHistories } = useForwardHistoryStore()

  const goBackward = () => {
    if (!backHistories.length) return

    const prev = backHistories.pop() ?? ''
    const prevItem = JSONUtil.getByPath(json, prev)

    setBackHistories([...backHistories])
    setForwardHistories((prev) => [...prev, currentItem.id])
    setCurrentItem({
      id: prev,
      data: prevItem as Record<string, unknown>,
    })
  }

  const goForward = () => {
    if (!forwardHistories.length) return

    const next = forwardHistories.pop() ?? ''
    const nextItem = JSONUtil.getByPath(json, next)

    setBackHistories((prev) => [...prev, currentItem.id])
    setForwardHistories([...forwardHistories])
    setCurrentItem({
      id: next,
      data: nextItem as Record<string, unknown>,
    })
  }

  const goPrev = () => {
    const parentPath = JSONUtil.getParentPath(currentItem.id)
    const item = JSONUtil.getByPath(json, parentPath)

    setCurrentItem({
      id: parentPath,
      data: item as Record<string, unknown>,
    })
    setBackHistories((prev) => [...prev, currentItem.id])
    setForwardHistories([])
  }

  return { goBackward, goForward, goPrev }
}
