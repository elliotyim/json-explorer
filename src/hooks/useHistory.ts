import { HistoryCommand } from '@/commands/HistoryCommand'
import { useHistoryCommandStore } from '@/store/history-command'
import { useCurrentItemStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'

interface ReturnProps {
  goTo: (path: string) => void
  goBackward: () => void
  goForward: () => void
  goPrev: () => void
}

export const useHistory = (): ReturnProps => {
  const { json } = useJsonStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()

  const { execute, undo, redo } = useHistoryCommandStore()

  const goTo = (path: string) => {
    if (path === currentItem.id) return

    const prev = currentItem.id
    const next = path

    const command = new HistoryCommand(prev, next)

    const id = execute(command)
    const data = JSONUtil.getByPath(json, id) as JSONObj['type']
    setCurrentItem({ id, data })
  }

  const goBackward = () => {
    const id = undo()
    if (id) {
      const data = JSONUtil.getByPath(json, id) as JSONObj['type']
      setCurrentItem({ id, data })
    }
  }

  const goForward = () => {
    const id = redo()
    if (id) {
      const data = JSONUtil.getByPath(json, id) as JSONObj['type']
      setCurrentItem({ id, data })
    }
  }

  const goPrev = () => {
    const prev = currentItem.id
    const next = JSONUtil.getParentPath(prev)

    const command = new HistoryCommand(prev, next)

    const id = execute(command)
    const data = JSONUtil.getByPath(json, id) as JSONObj['type']
    setCurrentItem({ id, data })
  }

  return { goTo, goBackward, goForward, goPrev }
}
