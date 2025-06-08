import { useTreeRefStore } from '@/store/tree'
import { useHistory } from './useHistory'
import { JSONUtil } from '@/utils/json'

interface ReturnProps {
  enterItem: (itemId: string) => void
}

export const useItemAction = (): ReturnProps => {
  const { treeRef } = useTreeRefStore()
  const { goTo } = useHistory()

  const enterItem = (itemId: string) => {
    goTo(itemId)
    const paths = JSONUtil.getTrailingPaths(itemId)
    paths.forEach((path) => treeRef.current?.open(path))
  }

  return { enterItem }
}
