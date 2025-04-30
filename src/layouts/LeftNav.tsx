import { DndTree } from '@/components/ui/dnd-tree/DndTree'
import SampleData from '@/fixtures/sample_data.json'

const LeftNav: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  return (
    <div {...props}>
      <DndTree data={SampleData} onClickItem={(node) => console.log(node)} />
    </div>
  )
}

export default LeftNav
