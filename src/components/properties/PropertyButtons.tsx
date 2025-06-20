import { JSONUtil } from '@/utils/json'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useItemEditingStore, useSelectedItemIdsStore } from '@/store/item'

interface Props {
  editedValue: string
  onEditStart?: () => void
  onSubmit?: () => void
  onCancel?: () => void
}

const PropertyButtons: React.FC<Props> = ({
  editedValue,
  onCancel,
  onEditStart,
  onSubmit,
}) => {
  const { selectedItemIds } = useSelectedItemIdsStore()
  const { isItemEditing } = useItemEditingStore()

  return (
    <div className="flex w-full gap-2">
      {!isItemEditing ? (
        <>
          <Button
            className="flex-1 cursor-pointer"
            disabled={Object.keys(selectedItemIds).length !== 1}
            onClick={() => onEditStart?.()}
          >
            Modify
          </Button>
        </>
      ) : (
        <>
          <Button
            className="flex-1 cursor-pointer"
            disabled={!JSONUtil.isJsonValid(editedValue)}
            onClick={() => onSubmit?.()}
          >
            Confirm
          </Button>
          <Button
            className="flex-1 cursor-pointer"
            variant="outline"
            onClick={() => onCancel?.()}
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  )
}

export default PropertyButtons
