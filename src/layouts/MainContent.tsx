import GridContainer from '@/components/dnd-grid/GridContainer'
import ExplorerContextMenu from '@/components/ExplorerContextMenu'
import { useDisplayItemsStore, useSelectedItemIdsStore } from '@/store/item'
import { JSONUtil } from '@/utils/json'
import { useEffect } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[]
  currentItem: CurrentItem
  onItemRelocation?: (targetIndex: number, selectedNodes: Data[]) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: Data[],
    targetIndex?: number,
  ) => void
}

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  currentItem,
  onItemRelocation,
  onItemMove,
  ...props
}) => {
  const { selectedItemIds } = useSelectedItemIdsStore()
  const { displayItems, setDisplayItems } = useDisplayItemsStore()

  useEffect(() => {
    if (!currentItem.data) return

    const input = JSONUtil.getByPath(json, currentItem.id)
    const data = JSONUtil.flatten({
      input,
      parentPath: currentItem.id,
      depth: 1,
    })

    setDisplayItems(data)
  }, [json, currentItem.id, currentItem.data, setDisplayItems])

  const items = Object.keys(selectedItemIds)

  return (
    <div {...props}>
      <ExplorerContextMenu selectedItems={items}>
        <GridContainer
          items={displayItems}
          currentItemId={currentItem.id}
          onItemRelocation={onItemRelocation}
          onItemMove={onItemMove}
        />
      </ExplorerContextMenu>
    </div>
  )
}

export default MainContent
