import { useTreeRefStore } from '@/store/tree'
import { useHistory } from './useHistory'
import { JSONUtil } from '@/utils/json'
import { MoveItemCommand } from '@/commands/item/MoveItemCommand'
import { useJsonStore } from '@/store/json'
import { useCommandStore } from '@/store/command'
import { useExtraItemIdsStore, useSelectedItemIdsStore } from '@/store/item'

interface ReturnProps {
  enterItem: (itemId: string, newJSON?: JSONObj['type']) => void
  moveItems: (
    selectedNodes: Data[],
    targetNode: Data,
    targetIndex?: number,
  ) => Promise<JSONObj['type']>
}

export const useItemAction = (): ReturnProps => {
  const { treeRef } = useTreeRefStore()
  const { goTo } = useHistory()
  const { execute } = useCommandStore()
  const { json, setJson } = useJsonStore()
  const { setSelectedItemIds } = useSelectedItemIdsStore()
  const { setExtraItemIds } = useExtraItemIdsStore()

  const enterItem = (itemId: string, newJSON: JSONObj['type'] = json) => {
    goTo(itemId, newJSON)
    const paths = JSONUtil.getTrailingPaths(itemId)
    paths.forEach((path) => treeRef.current?.open(path))
  }

  const moveItems = async (
    selectedNodes: Data[],
    targetNode: Data,
    targetIndex: number = -1,
  ): Promise<JSONObj['type']> => {
    const command = new MoveItemCommand(structuredClone(json), {
      selectedNodes,
      targetNode,
      targetIndex,
    })
    const result = await execute(command)

    setJson(result)
    setSelectedItemIds({})
    setExtraItemIds({})
    return result
  }

  return { enterItem, moveItems }
}
