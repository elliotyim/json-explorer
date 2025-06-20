import GridContainer from '@/components/dnd/grid/GridContainer'
import ExplorerContextMenu from '@/components/common/ExplorerContextMenu'
import { useCurrentItemStore, useDisplayItemsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { useEffect } from 'react'

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  const { json } = useJsonStore()
  const { currentItem } = useCurrentItemStore()
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

  return (
    <div {...props}>
      <ExplorerContextMenu>
        <GridContainer items={displayItems} />
      </ExplorerContextMenu>
    </div>
  )
}

export default MainContent
