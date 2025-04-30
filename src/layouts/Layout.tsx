import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'

const Layout = () => {
  return (
    <div className="flex h-screen w-full">
      <LeftNav className="w-2/12 overflow-y-auto" />
      <MainContent className="w-7/12 border-x border-slate-300 bg-green-300" />
      <RightNav className="w-3/12 bg-blue-300" />
    </div>
  )
}

export default Layout
