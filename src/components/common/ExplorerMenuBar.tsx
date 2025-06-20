import { ExportJSONCommand } from '@/commands/json/ExportJSONCommand'
import { ImportJSONCommand } from '@/commands/json/ImportJSONCommand'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useCommandStore } from '@/store/command'
import { useDialogStore } from '@/store/dialog'
import { useJsonStore } from '@/store/json'

interface Props {
  className?: string
}

const ExplorerMenuBar: React.FC<Props> = ({ ...props }) => {
  const { json, setJson } = useJsonStore()
  const { setDialog: setDialogOpen } = useDialogStore()
  const { execute, undo, undoList, redo, redoList } = useCommandStore()

  const alert = (
    title: string,
    content: string = '',
    cancelButton: boolean = false,
  ) => {
    setDialogOpen({ open: true, title, content, cancelButton })
  }

  const handleImport = async () => {
    const command = new ImportJSONCommand(structuredClone(json))
    try {
      const result = await execute(command)
      setJson(result)
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message)
      else if (typeof e === 'string') alert(e)
    }
  }

  const handleExport = async () => {
    const command = new ExportJSONCommand(JSON.stringify(json))
    await execute(command)
  }

  const handleUndo = async () => {
    const result = await undo()
    if (result) setJson(result)
  }

  const handleRedo = async () => {
    const result = await redo()
    if (result) setJson(result)
  }

  return (
    <Menubar {...props}>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={handleImport}>Import</MenubarItem>
          <MenubarItem onSelect={handleExport}>Export</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled={!undoList.length} onSelect={handleUndo}>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled={!redoList.length} onSelect={handleRedo}>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

export default ExplorerMenuBar
