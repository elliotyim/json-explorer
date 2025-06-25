import { ModifyItemCommand } from '@/commands/item/ModifyItemCommand'
import CodeEditor from '@/components/editor/CodeEditor'
import PropertyButtons from '@/components/properties/PropertyButtons'
import PropertyDescription from '@/components/properties/PropertyDescription'
import PropertyTitle from '@/components/properties/PropertyTitle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCommandStore } from '@/store/command'
import { useItemEditingStore, useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { editor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const Properties: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  const { json, setJson } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { isItemEditing, setIsItemEditing } = useItemEditingStore()
  const { execute } = useCommandStore()

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const [itemKey, setItemKey] = useState<string>('')
  const [editedValue, setEditedValue] = useState<string>('')

  const selectedItems = useMemo<Data[]>(
    () => Object.keys(selectedItemIds).map((id) => JSONUtil.inspect(json, id)),
    [json, selectedItemIds],
  )
  const singleItem = useMemo<Data | null>(
    () => (selectedItems.length === 1 ? selectedItems[0] : null),
    [selectedItems],
  )

  const itemValues = useCallback((): string => {
    const selectedIds = Object.keys(selectedItemIds)

    if (selectedIds.length === 1) {
      const singleItem = selectedItems[0]
      return JSON.stringify(singleItem?.value, null, 2)
    } else if (selectedIds.length > 1) {
      const parentPath = JSONUtil.getParentPath(selectedIds[0])
      const parent = JSONUtil.getByPath(json, parentPath)

      const sortedIds = Array.isArray(parent)
        ? JSONUtil.sortIndexPaths(selectedIds)
        : selectedIds
      const result = sortedIds.map((id) => JSONUtil.inspect(json, id).value)

      return JSON.stringify(result, null, 2)
    }
    return ''
  }, [json, selectedItemIds, selectedItems])

  const clearAll = useCallback(() => {
    const key = singleItem?.name ?? ''
    const value = JSON.stringify(singleItem?.value ?? '')

    setItemKey(key)
    setEditedValue(value)
    setIsItemEditing(false)

    editorRef?.current?.setValue(itemValues())
  }, [itemValues, setIsItemEditing, singleItem])

  const handleSubmit = useCallback(async () => {
    if (singleItem == null || editedValue == null) return

    const command = new ModifyItemCommand(structuredClone(json), {
      id: singleItem.id,
      parentId: singleItem.parentPath,
      changedKey: itemKey,
      changedValue: editedValue,
    })
    const result = await execute(command)

    setJson(result)
    setIsItemEditing(false)

    const parent = JSONUtil.getByPath(json, singleItem.parentPath)
    const originalId = singleItem.id

    let newId
    if (Array.isArray(parent)) {
      newId = JSONUtil.replaceLastKey(originalId, `[${itemKey}]`)
    } else {
      newId = JSONUtil.replaceLastKey(originalId, `${itemKey}`)
    }

    setSelectedItemIds({ [newId]: true })
  }, [
    editedValue,
    execute,
    itemKey,
    json,
    setIsItemEditing,
    setJson,
    setSelectedItemIds,
    singleItem,
  ])

  useEffect(() => {
    if (singleItem) {
      setItemKey(singleItem.name)
      setEditedValue(JSON.stringify(singleItem.value))
    }
  }, [singleItem])

  return (
    <Card
      className={cn('h-full overflow-x-hidden', props.className)}
      {...props}
    >
      <CardHeader>
        <CardTitle>
          <PropertyTitle
            itemKey={itemKey}
            selectedItems={selectedItems}
            onValueChange={(val) => setItemKey(val)}
            onSubmit={handleSubmit}
          />
        </CardTitle>
        <CardDescription>
          <PropertyDescription selectedItems={selectedItems} />
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full overflow-auto">
        <div className="flex h-full flex-col gap-2 pb-1">
          <CodeEditor
            readOnly={!isItemEditing}
            className="h-full overflow-auto"
            jsonString={itemValues()}
            onValueChange={(val) => setEditedValue(val)}
            editorRef={editorRef}
          />
          <PropertyButtons
            editedValue={editedValue}
            onCancel={clearAll}
            onEditStart={() => setIsItemEditing(true)}
            onSubmit={handleSubmit}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default Properties
