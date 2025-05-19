import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import { JSONUtil } from '@/utils/json'
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useMemo } from 'react'

interface Props {
  currentItem: CurrentItem
}

const TopNavigationBar: React.FC<
  React.HTMLAttributes<HTMLDivElement> & Props
> = ({ currentItem, ...props }) => {
  const node = useMemo<NodeModel<CustomData>>(() => {
    const id = currentItem.id
    const value = currentItem.data
    const payload: NodeModel<CustomData> = { id, parent: '', text: '' }

    if (Array.isArray(currentItem)) {
      payload.data = { type: 'array', value }
    } else if (typeof currentItem === 'object' && currentItem !== null) {
      payload.data = { type: 'object', value }
    } else {
      payload.data = { type: 'value', value }
    }

    return payload
  }, [currentItem])

  const displayCurrent = (path: string) => {
    const splitPath = JSONUtil.getSplitPaths({ path })
    return splitPath[splitPath.length - 1]
  }

  return (
    <div {...props}>
      <div className="flex min-h-[24px] items-center gap-4">
        <TypeIcon node={node} isOpen={false} />
        <span>{displayCurrent(currentItem.id)}</span>
      </div>
    </div>
  )
}

export default TopNavigationBar
