import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { TAB } from '@/constants/tab'
import { useContextMenuOpenStore } from '@/store/contextmenu'
import {
  useCurrentItemStore,
  useItemEditingStore,
  useSelectedItemIdsStore,
} from '@/store/item'
import { useJsonStore } from '@/store/json'
import { useRightNavTabStore } from '@/store/tab'
import { JSONUtil } from '@/utils/json'

interface Props {
  selectedItems: string[]
  children: React.ReactNode
}

const ExplorerContextMenu: React.FC<Props> = ({ selectedItems, children }) => {
  const { json, setJson } = useJsonStore()

  const { currentItem } = useCurrentItemStore()
  const { setSelectedItemIds } = useSelectedItemIdsStore()

  const { setIsItemEditing } = useItemEditingStore()
  const { setRightNavTab } = useRightNavTabStore()
  const { setIsContextOpen } = useContextMenuOpenStore()

  const handleItemCopy = (selectedItems: string[]) => {
    JSONUtil.copyItems(json, selectedItems)
  }

  const handleItemPaste = async () => {
    const result = JSONUtil.pastItems(json, currentItem.id)
    setJson(result)
  }

  const handleItemCut = (selectedItems: string[]) => {
    const result = JSONUtil.cutItems(json, selectedItems)
    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemEdit = (selectedItems: string[]) => {
    if (selectedItems.length === 1) {
      setRightNavTab(TAB.PROPERTIES)
      const timer = setTimeout(() => {
        setIsItemEditing(true)
        clearTimeout(timer)
      }, 0)
    }
  }

  const handleItemDelete = (selectedItems: string[]) => {
    const result = JSONUtil.deleteItems(json, selectedItems)
    setJson(result)
    setSelectedItemIds({})
  }

  const handleItemCreate = (type: Data['type']) => {
    const id = currentItem.id
    const itemSpec = JSONUtil.inspect({ obj: json, path: id })
    const item = JSONUtil.getByPath(json, id) as Record<string, unknown>

    let value
    if (type === 'array') value = []
    else if (type === 'object') value = {}
    else value = null

    let newItemPath
    if (Array.isArray(item)) {
      newItemPath = `${itemSpec.id}[${item.length}]`
      item.push(value)
    } else {
      const key = `new${type}`
      newItemPath = `${itemSpec.id}.${key}`
      item[key] = value
    }

    JSONUtil.set({ obj: json, keyPath: id, value: item })
    setJson(structuredClone(json))

    setRightNavTab(TAB.PROPERTIES)
    setSelectedItemIds({ [newItemPath]: true })

    const timer = setTimeout(() => {
      setIsItemEditing(true)
      clearTimeout(timer)
    }, 0)
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
        </ContextMenuItem>
        <ContextMenuItem
          inset
          disabled={sessionStorage.getItem('copyPaste') == null ? true : false}
          onSelect={handleItemPaste}
        >
          Paste
        </ContextMenuItem>
        <ContextMenuItem
          inset
          disabled={!selectedItems.length}
          onSelect={() => handleItemCut(selectedItems)}
        >
          Cut
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
        >
          Delete
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
