import fixture from '@/fixtures/sample.json'
import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useEffect, useRef, useState } from 'react'

import { NodeModel, TreeMethods } from '@minoru/react-dnd-treeview'
import { useDebouncedCallback } from 'use-debounce'
import AddressBar from './AddressBar'
import { JSONUtil } from '@/utils/json'
import TopNavigationBar from './TopNavigationBar'

const Main = () => {
  const [json, setJson] = useState<
    Record<string, unknown> | unknown[] | undefined
  >(fixture)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string>('root')
  const [selectedItem, setSelectedItem] = useState<
    Record<string, unknown> | unknown[] | undefined
  >()

  const treeRef = useRef<TreeMethods>(null)

  useEffect(() => {
    let item
    if (selectedItemId === 'root') item = json
    else item = JSONUtil.getByPath(json, selectedItemId)
    setSelectedItem(item as Record<string, unknown>)
  }, [json, selectedItemId])

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

  const handleItemMove = (
    source: HTMLElement,
    target: HTMLElement,
    relativeIndex?: number,
  ) => {
    const from = source.dataset.item as string
    const to = target.dataset.item as string

    JSONUtil.move({
      obj: json,
      from,
      to,
      relativeIndex,
    })
    setJson(structuredClone(json))
  }

  const handleItemEnter = (itemId: string) => {
    const paths = JSONUtil.getTrailingPaths(itemId)
    treeRef.current?.open(paths)
    setSelectedItemId(itemId)
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
      <TopNavigationBar
        className="bg-slate-100 px-5 py-2"
        selectedItem={selectedItem}
        selectedItemId={selectedItemId}
      />
      <AddressBar
        className="flex items-center gap-4 border px-4 py-2"
        currentPath={selectedItemId}
        onInputSubmit={handleOnInputSubmit}
      />
      <div className="flex w-full flex-1 overflow-auto">
        <LeftNav
          className="w-2/12 overflow-y-auto"
          json={json}
          selectedId={selectedItemId}
          treeRef={treeRef}
          onClickItem={handleMenuClick}
          onItemDrop={handleDrop}
          errorMessage={errorMessage}
        />
        <MainContent
          className="h-full w-7/12 overflow-auto border-x"
          json={json}
          selectedItem={selectedItem}
          selectedItemId={selectedItemId}
          onItemMove={handleItemMove}
          onItemEnter={handleItemEnter}
        />
        <RightNav
          className="flex h-full w-3/12 flex-col overflow-auto"
          json={json}
          onValueChange={(value) => debouncedValueChange(value)}
        />
      </div>
    </div>
  )
}

export default Main
