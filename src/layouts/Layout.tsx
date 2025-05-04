import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useState } from 'react'

import fixture from '@/fixtures/sample.json'

const Layout = () => {
  const [json, setJson] = useState<Record<string, unknown> | unknown[]>(fixture)

  const handleDrop = (newJson: Record<string, unknown> | unknown[]) => {
    setJson(newJson)
  }

  return (
    <div className="flex h-screen w-full">
      <LeftNav
        className="w-2/12 overflow-y-auto"
        json={json}
        onItemDrop={handleDrop}
      />
      <MainContent className="w-7/12 border-x border-slate-300 bg-green-300" />
      <RightNav className="w-3/12 bg-blue-300" json={json} />
    </div>
  )
}

export default Layout
