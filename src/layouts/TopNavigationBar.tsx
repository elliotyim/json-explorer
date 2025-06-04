import { FaGithub } from 'react-icons/fa6'

const TopNavigationBar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  return (
    <div {...props}>
      <div className="flex min-h-[36px] items-center gap-3">
        <a href="https://github.com/elliotyim/json-explorer">
          <FaGithub size={24} />
        </a>
        {/* <ExplorerMenuBar className="flex" />Z */}
      </div>
    </div>
  )
}

export default TopNavigationBar
