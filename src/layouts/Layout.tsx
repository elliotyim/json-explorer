import ExplorerDialog from '@/components/common/ExplorerDialog'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useKeyboardAction } from '@/hooks/useKeyboardAction'
import AddressBar from '@/layouts/AddressBar'
import LeftNav from '@/layouts/LeftNav'
import MainContent from '@/layouts/MainContent'
import MenuBar from '@/layouts/MenuBar'
import RightNav from '@/layouts/RightNav'
import { useCurrentItemStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useEffect } from 'react'

const Layout = () => {
  const { json } = useJsonStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()

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
        <MenuBar className="rounded-t-xl bg-slate-100 px-4 py-1" />
        <AddressBar className="flex items-center gap-4 border-b-2 px-4 py-2" />
        <ResizablePanelGroup direction="horizontal" className="w-full">
          <ResizablePanel defaultSize={15} minSize={10}>
            <LeftNav className="h-full w-full overflow-hidden rounded-bl-xl" />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            <MainContent className="h-full w-full overflow-auto border-x-2" />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <RightNav className="flex h-full w-full flex-col overflow-auto rounded-br-xl" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <ExplorerDialog />
    </div>
  )
}

export default Layout
