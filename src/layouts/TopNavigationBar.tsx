import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import { JSONUtil } from '@/utils/json'
import { NodeModel } from '@minoru/react-dnd-treeview'
import { useMemo } from 'react'

interface Props {
  selectedItem: Record<string, unknown> | unknown[] | undefined
  selectedItemId: string
}

const TopNavigationBar: React.FC<
  React.HTMLAttributes<HTMLDivElement> & Props
> = ({ selectedItem, selectedItemId, ...props }) => {
  const node = useMemo<NodeModel<CustomData>>(() => {
    const id = selectedItemId
    const value = selectedItem
    const payload: NodeModel<CustomData> = { id, parent: '', text: '' }

    if (Array.isArray(selectedItem)) {
      payload.data = { type: 'array', value }
    } else if (typeof selectedItem === 'object' && selectedItem !== null) {
      payload.data = { type: 'object', value }
    } else {
      payload.data = { type: 'value', value }
    }

    return payload
  }, [selectedItem, selectedItemId])

  const displayCurrent = (path: string) => {
    const splitPath = JSONUtil.getSplitPaths({ path })
    return splitPath[splitPath.length - 1]
  }

  return (
    <div {...props}>
      <div className="flex min-h-[24px] items-center gap-4">
        <TypeIcon node={node} isOpen={false} />
        <span>{displayCurrent(selectedItemId)}</span>
      </div>
    </div>
  )
}

export default TopNavigationBar
