import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useEffect, useRef } from 'react'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useBackHistoryStore } from '@/store/history'
import { useCurrentItemStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { TreeApi } from 'react-arborist'
import AddressBar from './AddressBar'
import TopNavigationBar from './TopNavigationBar'

const Layout = () => {
  const treeRef = useRef<TreeApi<Data>>(null)

  const { json, setJson } = useJsonStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()
  const { setBackHistories } = useBackHistoryStore()

  const handleOnInputSubmit = (currentPath: string) => {
    const id = currentPath
    const paths = JSONUtil.getTrailingPaths(id)

    paths.forEach((path) => treeRef.current?.open(path))

    const data = JSONUtil.getByPath(json, id) as Record<string, unknown>
    setCurrentItem({ id, data })
  }

  const handleItemRelocation = (
    targetIndex: number,
    selectedNodes: { index: number; item: Data }[],
  ) => {
    if (!selectedNodes.length) return

    const parentPath = selectedNodes?.[0]?.item.parentPath
    if (!parentPath || typeof parentPath !== 'string') return

    const parent = JSONUtil.getByPath(json, parentPath) as unknown[]
    const toBeChanged = new Set(selectedNodes.map((node) => node.index))
    const values = []

    for (const [index, value] of parent.entries()) {
      if (index === targetIndex) {
        selectedNodes.forEach((node) => values.push(node.item.value))
      }
      if (!toBeChanged.has(index)) {
        values.push(value)
      }
    }

    if (targetIndex === parent.length) {
      selectedNodes.forEach((node) => values.push(node.item.value))
    }

    const result = JSONUtil.set({
      obj: json,
      keyPath: parentPath,
      value: values,
    })

    const newJSON = Array.isArray(result) ? [...result] : { ...result }
    setJson(newJSON)
  }

  const handleItemMove = (
    source: HTMLElement,
    target: HTMLElement,
    selectedNodes: Data[],
    targetIndex?: number,
  ) => {
    const sourceId = source.dataset.item
    const targetId = target.dataset.item

    const wrongTarget = selectedNodes.filter(
      (node) => node.id !== sourceId && node.id === targetId,
    ).length

    if (wrongTarget || sourceId == null || targetId == null) return

    selectedNodes.forEach((node) => {
      JSONUtil.copy({
        obj: json,
        from: node.id,
        to: targetId,
        targetIndex,
      })
    })

    selectedNodes.reverse().forEach((node) => {
      const parent = JSONUtil.getByPath(json, node.parentPath)
      JSONUtil.remove(parent, node.id)
    })

    setJson(structuredClone(json))
  }

  const enterFolder = (itemId: string) => {
    if (itemId === currentItem.id) return

    const paths = JSONUtil.getTrailingPaths(itemId)
    paths.forEach((path) => treeRef.current?.open(path))

    const data = JSONUtil.getByPath(json, itemId) as Record<string, unknown>
    const parentPath = JSONUtil.getParentPath(itemId)

    setCurrentItem({ id: itemId, data })
    setBackHistories((prev) => [...prev, parentPath])
  }

  useEffect(() => {
    if (!currentItem.id) setCurrentItem({ id: 'root', data: json })
  }, [currentItem.id, json, setCurrentItem])

  return (
    <div className="flex h-screen w-full flex-col">
      <TopNavigationBar
        className="bg-slate-100 px-5 py-2"
        currentItem={currentItem}
      />
      <AddressBar
        className="flex items-center gap-4 border-b-2 px-4 py-2"
        currentPath={currentItem.id}
        onInputSubmit={handleOnInputSubmit}
      />
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full overflow-auto"
      >
        <ResizablePanel defaultSize={15} minSize={10}>
          <LeftNav
            className="h-full w-full overflow-y-auto"
            json={json}
            treeRef={treeRef}
            enterFolder={enterFolder}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          <MainContent
            className="h-full w-full overflow-auto border-x-2"
            json={json}
            currentItem={currentItem}
            onItemRelocation={handleItemRelocation}
            onItemMove={handleItemMove}
            onItemEnter={enterFolder}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25} minSize={10}>
          <RightNav
            className="flex h-full w-full flex-col overflow-auto"
            json={json}
            onValueChange={(value) => setJson(JSON.parse(value))}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Layout
