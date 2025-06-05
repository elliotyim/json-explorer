import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { UPLOAD_LIMIT } from '@/constants/file'
import { useDialogStore } from '@/store/dialog'
import { useJsonStore } from '@/store/json'

interface Props {
  className?: string
}

const ExplorerMenuBar: React.FC<Props> = ({ ...props }) => {
  const { json, setJson } = useJsonStore()

  const { setDialog: setDialogOpen } = useDialogStore()

  const alert = (
    title: string,
    content: string = '',
    cancelButton: boolean = false,
  ) => {
    setDialogOpen({ open: true, title, content, cancelButton })
  }

  const convert = (bytes: number, decimalPlaces = 0): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let index = 0
    let size = bytes
    while (size >= 1024) {
      size /= 1024
      index++
    }
    return `${size.toFixed(decimalPlaces)} ${units[index]}`
  }

  const exportJSON = (jsonString: string) => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'output.json'
    a.click()
  }

  const importJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json, .json'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files?.length === 1) {
        const file = target.files[0]
        if (file.size > UPLOAD_LIMIT) {
          alert(`File size exceeds ${convert(UPLOAD_LIMIT)}`)
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string
            setJson(JSON.parse(content))
          } catch {
            alert('Invalid JSON file has been provided')
          }
        }
        reader.onerror = () => alert('Failed to read the file')
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <Menubar {...props}>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => importJSON()}>Import</MenubarItem>
          <MenubarItem onSelect={() => exportJSON(JSON.stringify(json))}>
            Export
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled>Cut</MenubarItem>
          <MenubarItem disabled>Copy</MenubarItem>
          <MenubarItem disabled>Paste</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

export default ExplorerMenuBar
