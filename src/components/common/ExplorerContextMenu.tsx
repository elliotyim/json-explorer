import { CopyItemCommand } from '@/commands/item/CopyItemCommand'
import { CreateItemCommand } from '@/commands/item/CreateItemCommand'
import { CutItemCommand } from '@/commands/item/CutItemCommand'
import { DeleteItemCommand } from '@/commands/item/DeleteItemCommand'
import { PasteItemCommand } from '@/commands/item/PasteItemCommand'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { TAB } from '@/constants/tab'
import { useCommandStore } from '@/store/command'
import { useContextMenuOpenStore } from '@/store/contextmenu'
import {
  useCurrentItemStore,
  useItemEditingStore,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'
import { useMemo } from 'react'

interface Props {
  children: React.ReactNode
}

const ExplorerContextMenu: React.FC<Props> = ({ children }) => {
  const { json, setJson } = useJsonStore()

  const { currentItem, setCurrentItem } = useCurrentItemStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()

  const { setIsItemEditing } = useItemEditingStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { setIsContextOpen } = useContextMenuOpenStore()
  const { execute } = useCommandStore()

  const selectedItems = useMemo<string[]>(
    () => Object.keys(selectedItemIds),
    [selectedItemIds],
  )

  const handleItemCopy = async (ids: string[]) => {
    const command = new CopyItemCommand(structuredClone(json), { ids })
    await execute(command)
  }

  const handleItemPaste = async () => {
    const command = new PasteItemCommand(structuredClone(json), {
      currentItemId: currentItem.id,
    })
    const result = await execute(command)
    setJson(result)
  }

  const handleItemCut = async (ids: string[]) => {
    const command = new CutItemCommand(structuredClone(json), { ids })
    const result = await execute(command)

    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemEdit = (selectedItems: string[]) => {
    if (selectedItems.length === 1) {
      setRightNavTab(TAB.PROPERTIES)
      const timer = setTimeout(() => {
        setIsItemEditing(true)
        clearTimeout(timer)
      }, 500)
    }
  }

  const handleItemDelete = async (ids: string[]) => {
    const command = new DeleteItemCommand(structuredClone(json), { ids })
    const result = await execute(command)
    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemCreate = async (type: Data['type']) => {
    const command = new CreateItemCommand(structuredClone(json), {
      currentItemId: currentItem.id,
      type,
    })
    const result = await execute(command)

    const itemSpec = JSONUtil.inspect({ obj: result, path: currentItem.id })
    const newData = JSONUtil.getByPath(result, itemSpec.id) as JSONObj['type']

    let newItemPath
    if (Array.isArray(newData)) {
      newItemPath = `${currentItem.id}[${currentItem.data.length}]`
    } else {
      newItemPath = `${currentItem.id}.new${type}`
    }

    setJson(result)
    setCurrentItem({ id: currentItem.id, data: newData })

    setRightNavTab(TAB.PROPERTIES)
    setSelectedItemIds({ [newItemPath]: true })

    const timer = setTimeout(() => {
      setIsItemEditing(true)
      clearTimeout(timer)
    }, 500)
  }

  const handleDisplayProperties = () => {
    setRightNavTab(TAB.PROPERTIES)
  }

  return (
    <ContextMenu onOpenChange={setIsContextOpen}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          inset
          disabled={!selectedItems.length}
          onSelect={() => handleItemCopy(selectedItems)}
        >
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          inset
          disabled={sessionStorage.getItem('copyPaste') == null ? true : false}
          onSelect={handleItemPaste}
        >
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          inset
          disabled={!selectedItems.length}
          onSelect={() => handleItemCut(selectedItems)}
        >
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuItem
          inset
          disabled={!selectedItems.length}
          onSelect={() => handleItemEdit(selectedItems)}
        >
          Modify
        </ContextMenuItem>
        <ContextMenuItem
          inset
          disabled={!selectedItems.length}
          onSelect={() => handleItemDelete(selectedItems)}
          variant="destructive"
        >
          Delete
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>New</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={() => handleItemCreate('array')}>
              Array
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleItemCreate('object')}>
              Object
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handleItemCreate('value')}>
              Value
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem inset onSelect={handleDisplayProperties}>
          Properties
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default ExplorerContextMenu
