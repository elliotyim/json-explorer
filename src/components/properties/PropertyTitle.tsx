import { TypeIcon } from '@/components/common/TypeIcon'
import { Input } from '@/components/ui/input'
import { useItemEditingStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { useEffect, useMemo, useRef } from 'react'

interface Props {
  itemKey: string
  selectedItems: Data[]
  onSubmit?: () => void
  onValueChange?: (value: string) => void
}

const PropertyTitle: React.FC<Props> = ({
  itemKey,
  selectedItems,
  onSubmit,
  onValueChange,
}) => {
  const { json } = useJsonStore()
  const { isItemEditing } = useItemEditingStore()

  const inputRef = useRef<HTMLInputElement>(null)

  const singleItem = useMemo<Data | null>(
    () => (selectedItems.length === 1 ? selectedItems[0] : null),
    [selectedItems],
  )

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
              e.stopPropagation()
              if (e.key === 'Enter') onSubmit?.()
            }}
            onChange={(e) => onValueChange?.(e.target.value)}
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

  useEffect(() => {
    if (isItemEditing) inputRef.current?.focus()
  }, [isItemEditing])

  return (
    <div className="flex items-center gap-2">
      <TypeIcon type={singleItem?.type} />
      {renderTitle()}
    </div>
  )
}

export default PropertyTitle
