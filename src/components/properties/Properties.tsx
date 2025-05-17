import { TypeIcon } from '@/components/dnd-tree/TypeIcon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useItemEditingStore, useSelectedItemIdsStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { useEffect, useMemo, useState } from 'react'
import { FaQuestion } from 'react-icons/fa6'
import CodeEditor from '../code-editor/CodeEditor'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { NodeModel } from '@minoru/react-dnd-treeview'

const Properties: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  const [itemKey, setItemKey] = useState<string>('')
  const [itemValue, setItemValue] = useState<unknown>()

  const [editedValue, setEditedValue] = useState<string>('')

  const { json, setJson } = useJsonStore()
  const { selectedItemIds, setSelectedItemIds } = useSelectedItemIdsStore()
  const { isItemEditing, setIsItemEditing } = useItemEditingStore()

  const selectedItems = useMemo<NodeModel<CustomData>[]>(
    () =>
      Object.keys(selectedItemIds).map((id) =>
        JSONUtil.inspect({ obj: json, path: id }),
      ),
    [json, selectedItemIds],
  )
  const singleItem = selectedItems.length === 1 ? selectedItems[0] : null

  const clearAll = () => {
    setItemKey('')
    setEditedValue('')
    setIsItemEditing(false)
  }

  const isJsonValid = (jsonString: string) => {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = () => {
    if (singleItem == null || editedValue == null) return

    const parent = JSONUtil.getByPath(json, singleItem.parent as string)
    const value = JSON.parse(editedValue)

    const originalId = singleItem.id as string

    let newId
    if (Array.isArray(parent)) {
      newId = JSONUtil.replaceLastKey(originalId, `[${itemKey}]`)
    } else {
      newId = JSONUtil.replaceLastKey(originalId, `${itemKey}`)
    }

    console.log(originalId, newId)

    JSONUtil.set({ obj: json, keyPath: newId, value })
    if (originalId !== newId) JSONUtil.remove(parent, originalId)

    setJson(structuredClone(json))
    setIsItemEditing(false)
    setSelectedItemIds({ [newId]: true })
  }

  const renderIcon = () => {
    if (singleItem) return <TypeIcon node={singleItem} isOpen={false} />
    else return <FaQuestion />
  }

  const renderTitle = () => {
    let text
    if (singleItem != null) {
      const parent = JSONUtil.getByPath(json, singleItem.parent as string)
      if (!Array.isArray(parent) && isItemEditing) {
        return (
          <Input value={itemKey} onChange={(e) => setItemKey(e.target.value)} />
        )
      }

      text = singleItem.text
    } else if (selectedItems.length) {
      text = `${selectedItems.length} item selected`
    } else {
      text = 'No Item'
    }

    return <span>{text}</span>
  }

  const renderDescription = () => {
    if (selectedItems.length === 0) return 'No Description'
    else if (selectedItems.length === 1) return singleItem?.data?.type
    else return 'Complex'
  }

  const renderPreview = () => {
    const ids = Object.keys(selectedItemIds)
    if (ids.length === 1) {
      return JSON.stringify(singleItem?.data?.value, null, 2)
    } else if (ids.length > 1) {
      const parentPath = JSONUtil.getParentPath(ids[0])
      const parent = JSONUtil.getByPath(json, parentPath)

      const sortedIds =
        JSONUtil.getType(parent) === 'array'
          ? JSONUtil.sortIndexPaths(ids)
          : ids
      const result = sortedIds.map(
        (id) => JSONUtil.inspect({ obj: json, path: id }).data?.value,
      )

      return JSON.stringify(result, null, 2)
    }
    return null
  }

  useEffect(() => {
    if (singleItem) {
      setItemKey(singleItem.text)
      setItemValue(singleItem.data?.value)
      setEditedValue(JSON.stringify(singleItem.data?.value))
    }
  }, [singleItem, isItemEditing])

  return (
    <Card className={cn('h-full', props.className)} {...props}>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            {renderIcon()}
            {renderTitle()}
          </div>
        </CardTitle>
        <CardDescription>{renderDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="h-full overflow-auto">
        <div className="flex h-full flex-col gap-2">
          {isItemEditing ? (
            <>
              <CodeEditor
                className="h-full overflow-auto"
                jsonString={JSON.stringify(itemValue, null, 2)}
                onValueChange={(val) => setEditedValue(val)}
              />
              <div className="flex w-full gap-2">
                <Button
                  className="flex-1 cursor-pointer"
                  disabled={!isJsonValid(editedValue)}
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
              </div>
            </>
          ) : (
            <>
              <pre className="h-full overflow-auto rounded-lg border border-slate-200 p-4">
                {renderPreview()}
              </pre>
              <div className="flex w-full gap-2">
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={() => setIsItemEditing(true)}
                >
                  Modify
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Properties
