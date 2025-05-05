import fixture from '@/fixtures/sample.json'
import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useRef, useState } from 'react'

import { NodeModel, TreeMethods } from '@minoru/react-dnd-treeview'
import { useDebouncedCallback } from 'use-debounce'
import MenuBar from './MenuBar'
import { JSONUtil } from '@/utils/json'

const Main = () => {
  const [json, setJson] = useState<
    Record<string, unknown> | unknown[] | undefined
  >(fixture)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>()
  const treeRef = useRef<TreeMethods>(null)

  const handleOnInputSubmit = (currentPath: string) => {
    const paths = JSONUtil.getTrailingPaths(currentPath)
    treeRef.current?.open(paths)
    setSelectedItemId(currentPath)
  }

  const handleMenuClick = (node: NodeModel<CustomData>) => {
    setSelectedItemId(`${node.id}`)
  }

  const handleDrop = (newJson: Record<string, unknown> | unknown[]) => {
    setJson(newJson)
  }

  const debouncedValueChange = useDebouncedCallback((value) => {
    if (!value) return

    try {
      setJson(JSON.parse(value))
      setErrorMessage(null)
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        setErrorMessage('JSON input is not valid!')
      } else {
        throw e
      }
    }
  }, 1000)

  return (
    <div className="flex h-screen w-full flex-col">
      <MenuBar
        className="flex items-center gap-4 border px-4 py-2"
        currentPath={selectedItemId ?? ''}
        onInputSubmit={handleOnInputSubmit}
      />
      <div className="flex w-full flex-1 overflow-auto">
        <LeftNav
          className="w-2/12 overflow-y-auto"
          json={json}
          selectedId={selectedItemId as string}
          treeRef={treeRef}
          onClickItem={handleMenuClick}
          onItemDrop={handleDrop}
          errorMessage={errorMessage}
        />
        <MainContent className="w-7/12 border-x border-slate-300 bg-green-300" />
        <RightNav
          className="flex h-full w-3/12 flex-col overflow-auto bg-[#1e1e1e]"
          json={json}
          onValueChange={(value) => debouncedValueChange(value)}
        />
      </div>
    </div>
  )
}

export default Main
