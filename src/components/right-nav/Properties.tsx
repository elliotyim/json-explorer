import { ModifyItemCommand } from '@/commands/ModifyItemCommand'
import CodeEditor from '@/components/code-editor/CodeEditor'
import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCommandStore } from '@/store/command'
import { useItemEditingStore, useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { useEffect, useMemo, useRef, useState } from 'react'

const Properties: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const [itemKey, setItemKey] = useState<string>('')
  const [editedValue, setEditedValue] = useState<string>('')

  const { json, setJson } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { isItemEditing, setIsItemEditing } = useItemEditingStore()

  const { execute } = useCommandStore()

  const selectedItems = useMemo<Data[]>(
    () =>
      Object.keys(selectedItemIds).map((id) =>
        JSONUtil.inspect({ obj: json, path: id }),
      ),
    [json, selectedItemIds],
  )
  const singleItem = selectedItems.length === 1 ? selectedItems[0] : null

  const itemValues = (selectedIds: string[]): string => {
    if (selectedIds.length === 1) {
      return JSON.stringify(singleItem?.value, null, 2)
    } else if (selectedIds.length > 1) {
      const parentPath = JSONUtil.getParentPath(selectedIds[0])
      const parent = JSONUtil.getByPath(json, parentPath)

      const sortedIds =
        JSONUtil.getType(parent) === 'array'
          ? JSONUtil.sortIndexPaths(selectedIds)
          : selectedIds
      const result = sortedIds.map(
        (id) => JSONUtil.inspect({ obj: json, path: id }).value,
      )

      return JSON.stringify(result, null, 2)
    }
    return ''
  }

  const clearAll = () => {
    setItemKey('')
    setEditedValue('')
    setIsItemEditing(false)
  }

  const handleSubmit = async () => {
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
  }

  const renderTitle = () => {
    let text
    if (singleItem != null) {
      const parent = JSONUtil.getByPath(json, singleItem.parentPath)
      if (!Array.isArray(parent) && isItemEditing) {
        return (
          <Input
            ref={inputRef}
            value={itemKey}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            onChange={(e) => setItemKey(e.target.value)}
          />
        )
      }

      text = singleItem.name
    } else if (selectedItems.length) {
      text = `${selectedItems.length} item selected`
    } else {
      text = 'No Item'
    }

    return <span>{text}</span>
  }

  const renderDescription = () => {
    if (selectedItems.length === 0) return 'No Description'
    else if (selectedItems.length === 1) return singleItem?.type
    else return 'Complex'
  }

  useEffect(() => {
    if (singleItem) {
      setItemKey(singleItem.name)
      setEditedValue(JSON.stringify(singleItem.value))
    }
  }, [singleItem])

  useEffect(() => {
    if (isItemEditing) inputRef.current?.focus()
  }, [isItemEditing])

  return (
    <Card className={cn('h-full', props.className)} {...props}>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <TypeIcon type={singleItem?.type} />
            {renderTitle()}
          </div>
        </CardTitle>
        <CardDescription>{renderDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="h-full overflow-auto">
        <div className="flex h-full flex-col gap-2">
          <CodeEditor
            readOnly={!isItemEditing}
            className="h-full overflow-auto"
            jsonString={itemValues(Object.keys(selectedItemIds))}
            onValueChange={(val) => setEditedValue(val)}
          />
          <div className="flex w-full gap-2">
            {isItemEditing ? (
              <>
                <Button
                  className="flex-1 cursor-pointer"
                  disabled={!JSONUtil.isJsonValid(editedValue)}
                  onClick={handleSubmit}
                >
                  Confirm
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  variant="outline"
                  onClick={() => clearAll()}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1 cursor-pointer"
                  disabled={Object.keys(selectedItemIds).length !== 1}
                  onClick={() => setIsItemEditing(true)}
                >
                  Modify
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Properties
