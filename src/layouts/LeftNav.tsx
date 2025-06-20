import DndTree from '@/components/dnd/tree/DndTree'
import TreeSearchInput from '@/components/left-nav/TreeSearchInput'

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  return (
    <div {...props}>
      <div className="flex h-full w-full flex-col">
        <TreeSearchInput />
        <DndTree />
      </div>
    </div>
  )
}

export default LeftNav
