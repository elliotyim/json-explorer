import GridContainer from '@/components/dnd-grid/GridContainer'
import { JSONUtil } from '@/utils/json'
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[]
  selectedItem: Record<string, unknown> | unknown[] | undefined
  selectedItemId: string
  onItemRelocation?: (
    targetIndex: number,
    selectedNodes: {
      index: number
      item: NodeModel<CustomData>
    }[],
  ) => void
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: NodeModel<CustomData>[],
    targetIndex?: number,
  ) => void
  onItemEnter?: (itemId: string) => void
}

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  selectedItem,
  selectedItemId,
  onItemRelocation,
  onItemMove,
  onItemEnter,
  ...props
}) => {
  const [displayItems, setDisplayItems] = useState<NodeModel<CustomData>[]>([])

  useEffect(() => {
    if (!selectedItem) return

    const data = JSONUtil.flatten({
      input: selectedItem,
      parentPath: selectedItemId,
      depth: 1,
    })

    setDisplayItems(data)
  }, [json, selectedItem, selectedItemId])

  return (
    <div {...props}>
      <GridContainer
        json={json}
        items={displayItems}
        selectedItemId={selectedItemId}
        onItemRelocation={onItemRelocation}
        onItemMove={onItemMove}
        onItemEnter={onItemEnter}
      />
    </div>
  )
}

export default MainContent
