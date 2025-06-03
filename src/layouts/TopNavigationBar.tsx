import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import { JSONUtil } from '@/utils/json'
import { useMemo } from 'react'
import { FaGithub } from 'react-icons/fa6'

interface Props {
  currentItem: CurrentItem
}

const TopNavigationBar: React.FC<
  React.HTMLAttributes<HTMLDivElement> & Props
> = ({ currentItem, ...props }) => {
  const node = useMemo<Data>(() => {
    const id = currentItem.id
    const value = currentItem.data
    const payload: Data = { id, name: '', value, type: 'value', parentPath: '' }

    if (Array.isArray(currentItem)) {
      payload.type = 'array'
    } else if (typeof currentItem === 'object' && currentItem !== null) {
      payload.type = 'object'
    }

    return payload
  }, [currentItem])

  const displayCurrent = (path: string) => {
    const splitPath = JSONUtil.getSplitPaths({ path })
    return splitPath[splitPath.length - 1]
  }

  return (
    <div {...props}>
      <div className="flex items-center justify-between">
        <div className="flex min-h-[24px] items-center gap-4">
          <TypeIcon type={node.type} />
          <span>{displayCurrent(currentItem.id)}</span>
        </div>
        <a href="https://github.com/elliotyim/json-explorer">
          <FaGithub size={24} />
        </a>
      </div>
    </div>
  )
}

export default TopNavigationBar
