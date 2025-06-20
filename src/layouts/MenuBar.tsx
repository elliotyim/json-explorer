import ExplorerMenuBar from '@/components/common/ExplorerMenuBar'
import { FaGithub } from 'react-icons/fa6'

const MenuBar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  return (
    <div {...props} tabIndex={-1}>
      <div className="flex min-h-[36px] items-center gap-3">
        <a href="https://github.com/elliotyim/json-explorer">
          <FaGithub size={24} />
        </a>
        <ExplorerMenuBar />
      </div>
    </div>
  )
}

export default MenuBar
