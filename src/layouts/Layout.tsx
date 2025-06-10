import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import RightNav from '@/layouts/RightNav'
import { useEffect } from 'react'

import { MoveItemCommand } from '@/commands/item/MoveItemCommand'
import ExplorerDialog from '@/components/ExplorerDialog'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useKeyboardAction } from '@/hooks/useKeyboardAction'
import AddressBar from '@/layouts/AddressBar'
import TopNavigationBar from '@/layouts/TopNavigationBar'
import { useCommandStore } from '@/store/command'
import { useCurrentItemStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useTreeRefStore } from '@/store/tree'
import { JSONUtil } from '@/utils/json'

const Layout = () => {
  const { json, setJson } = useJsonStore()
  const { treeRef } = useTreeRefStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()
  const { execute } = useCommandStore()

  const handleOnInputSubmit = (currentPath: string) => {
    const id = currentPath
    const paths = JSONUtil.getTrailingPaths(id)

    paths.forEach((path) => treeRef.current?.open(path))

    const data = JSONUtil.getByPath(json, id) as Record<string, unknown>
    setCurrentItem({ id, data })
  }

  const handleItemRelocation = async (
    targetIndex: number,
    selectedNodes: Data[],
  ) => {
    const parentPath = selectedNodes.at(0)?.parentPath
    if (!selectedNodes.length || parentPath == null) return

    const targetNode = JSONUtil.inspect({ obj: json, path: parentPath })

    const command = new MoveItemCommand(structuredClone(json), {
      selectedNodes,
      targetNode,
      targetIndex,
    })
    const result = await execute(command)

    setJson(result)
  }

  const handleItemMove = async (
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

    const targetNode = JSONUtil.inspect({ obj: json, path: targetId })

    const command = new MoveItemCommand(structuredClone(json), {
      selectedNodes,
      targetNode,
      targetIndex,
    })
    const result = await execute(command)

    setJson(result)
  }

  const {
    onKeyUp,
    undoAction,
    redoAction,
    selectAllAction,
    cancelSelectionAtion,
    copyItemAction,
    pastItemAction,
    cutItemAction,
    deleteItemAction,
  } = useKeyboardAction()

  useEffect(() => {
    if (!currentItem.id) setCurrentItem({ id: 'root', data: json })
  }, [currentItem.id, json, setCurrentItem])

  return (
    <div className="flex h-screen w-full">
      <div
        className="m-20 flex w-full flex-col rounded-xl border border-slate-300"
        onKeyDown={async (e) => {
          await undoAction(e)
          await redoAction(e)
          selectAllAction(e)
          cancelSelectionAtion(e)
          await copyItemAction(e)
          await pastItemAction(e)
          await cutItemAction(e)
          await deleteItemAction(e)
        }}
        onKeyUp={onKeyUp}
      >
        <TopNavigationBar className="rounded-t-xl bg-slate-100 px-4 py-1" />
        <AddressBar
          className="flex items-center gap-4 border-b-2 px-4 py-2"
          currentPath={currentItem.id}
          onInputSubmit={handleOnInputSubmit}
        />
        <ResizablePanelGroup direction="horizontal" className="w-full">
          <ResizablePanel defaultSize={15} minSize={10}>
            <LeftNav className="h-full w-full overflow-hidden rounded-bl-xl" />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            <MainContent
              className="h-full w-full overflow-auto border-x-2"
              json={json}
              currentItem={currentItem}
              onItemRelocation={handleItemRelocation}
              onItemMove={handleItemMove}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <RightNav
              className="flex h-full w-full flex-col overflow-auto rounded-br-xl"
              json={json}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <ExplorerDialog />
    </div>
  )
}

export default Layout
