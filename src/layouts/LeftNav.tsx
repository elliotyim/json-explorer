import DndTree from '@/components/dnd-tree/DndTree'
import TreeSearchInput from '@/components/left-nav/TreeSearchInput'
import { TreeApi } from 'react-arborist'

interface Props {
  treeRef: React.RefObject<TreeApi<Data> | null>
  enterFolder: (id: string) => void
}

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  treeRef,
  enterFolder,
  ...props
}) => {
  return (
    <div {...props}>
      <div className="flex h-full w-full flex-col">
        <TreeSearchInput />
        <DndTree treeRef={treeRef} enterFolder={enterFolder} />
      </div>
    </div>
  )
}

export default LeftNav
