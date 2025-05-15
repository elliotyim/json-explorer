import fixture from '@/fixtures/sample.json'

import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useEffect, useRef, useState } from 'react'

import { JSONUtil } from '@/utils/json'
import { NodeModel, TreeMethods } from '@minoru/react-dnd-treeview'
import { useDebouncedCallback } from 'use-debounce'
import AddressBar from './AddressBar'
import TopNavigationBar from './TopNavigationBar'

const Main = () => {
  const [json, setJson] = useState<Record<string, unknown> | unknown[]>(fixture)
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

  const handleItemRelocation = (
    targetIndex: number,
    selectedNodes: { index: number; item: NodeModel<CustomData> }[],
  ) => {
    if (!selectedNodes.length) return

    const parentPath = selectedNodes?.[0]?.item.parent
    if (!parentPath || typeof parentPath !== 'string') return

    const parent = JSONUtil.getByPath(json, parentPath) as unknown[]
    const toBeChanged = new Set(selectedNodes.map((node) => node.index))
    const result = []

    for (const [index, value] of parent.entries()) {
      if (index === targetIndex) {
        selectedNodes.forEach((node) => result.push(node.item.data?.value))
      }
      if (!toBeChanged.has(index)) {
        result.push(value)
      }
    }

    if (targetIndex === parent.length) {
      selectedNodes.forEach((node) => result.push(node.item.data?.value))
    }

    JSONUtil.set({ obj: json, keyPath: parentPath, value: result })

    setJson({ ...json })
  }

  const handleItemMove = (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: NodeModel<CustomData>[],
    targetIndex?: number,
  ) => {
    const sourceId = source.dataset.item as string
    const targetId = target.dataset.item as string

    const wrongTarget = selectedNodes.filter(
      (node) => node.id !== sourceId && node.id === targetId,
    ).length

    if (wrongTarget) return

    selectedNodes.forEach((node) => {
      JSONUtil.copy({
        obj: json,
        from: node.id as string,
        to: targetId,
        targetIndex,
      })
    })

    selectedNodes.reverse().forEach((node) => {
      const parent = JSONUtil.getByPath(json, node.parent as string)
      JSONUtil.remove(parent, node.id as string)
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
          className="h-full w-2/12 overflow-y-auto"
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
          onItemRelocation={handleItemRelocation}
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
