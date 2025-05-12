import GridContainer from '@/components/dnd-grid/GridContainer'
import { JSONUtil } from '@/utils/json'
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useEffect, useState } from 'react'

interface Props {
  json: Record<string, unknown> | unknown[] | undefined
  selectedItem: Record<string, unknown> | unknown[] | undefined
  selectedItemId: string
  onItemMove?: (
    source: HTMLElement,
    target: HTMLElement,
    relativeIndex?: number,
  ) => void
}

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  selectedItem,
  selectedItemId,
  onItemMove,
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
      <GridContainer items={displayItems} onItemMove={onItemMove} />
    </div>
  )
}

export default MainContent
