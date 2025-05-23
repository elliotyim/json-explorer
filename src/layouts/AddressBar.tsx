import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BUTTON } from '@/constants/button'
import { useBackHistoryStore, useForwardHistoryStore } from '@/store/history'
import { useCurrentItemStore } from '@/store/item'
import { useJsonStore } from '@/store/json'
import { JSONUtil } from '@/utils/json'
import { useEffect, useState } from 'react'
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowTurnDown,
  FaArrowUp,
} from 'react-icons/fa6'

interface Props {
  currentPath: string
  onInputSubmit?: (currentPath: string) => void
}

const MenuBar: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  currentPath,
  onInputSubmit,
  ...props
}) => {
  const [inputValue, setInputValue] = useState<string>('')

  const { json } = useJsonStore()
  const { currentItem, setCurrentItem } = useCurrentItemStore()

  const { backHistories, setBackHistories } = useBackHistoryStore()
  const { forwardHistories, setForwardHistories } = useForwardHistoryStore()

  const handleBackButtonClick = () => {
    if (!backHistories.length) return

    const prev = backHistories.pop() ?? ''
    const prevItem = JSONUtil.getByPath(json, prev)

    setBackHistories([...backHistories])
    setForwardHistories((prev) => [...prev, currentItem.id])
    setCurrentItem({
      id: prev,
      data: prevItem as Record<string, unknown>,
    })
  }

  const handleForwardButtonClick = () => {
    if (!forwardHistories.length) return

    const next = forwardHistories.pop() ?? ''
    const nextItem = JSONUtil.getByPath(json, next)

    setBackHistories((prev) => [...prev, currentItem.id])
    setForwardHistories([...forwardHistories])
    setCurrentItem({
      id: next,
      data: nextItem as Record<string, unknown>,
    })
  }

  const handleUpButtonClick = () => {
    const parentPath = JSONUtil.getParentPath(currentItem.id)
    const item = JSONUtil.getByPath(json, parentPath)

    setCurrentItem({
      id: parentPath,
      data: item as Record<string, unknown>,
    })
    setBackHistories((prev) => [...prev, currentItem.id])
    setForwardHistories([])
  }

  useEffect(() => {
    if (currentPath) setInputValue(currentPath)
  }, [currentPath])

  return (
    <div {...props}>
      <div className="flex gap-2">
        <Button
          variant={'outline'}
          disabled={!backHistories.length}
          onClick={handleBackButtonClick}
        >
          <FaArrowLeft size={BUTTON.SIZE} />
        </Button>
        <Button
          variant={'outline'}
          disabled={!forwardHistories.length}
          onClick={handleForwardButtonClick}
        >
          <FaArrowRight size={BUTTON.SIZE} />
        </Button>
        <Button
          variant={'outline'}
          disabled={currentItem.id === 'root'}
          onClick={handleUpButtonClick}
        >
          <FaArrowUp size={BUTTON.SIZE} />
        </Button>
      </div>
      <div className="flex-1">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (!inputValue || !onInputSubmit) return
            if (e.key === 'Enter') onInputSubmit(inputValue)
          }}
        />
      </div>
      <Button
        variant={'outline'}
        disabled={!inputValue}
        onClick={() => {
          if (inputValue && onInputSubmit) onInputSubmit(inputValue)
        }}
      >
        <FaArrowTurnDown className="rotate-90" size={BUTTON.SIZE} />
      </Button>
    </div>
  )
}

export default MenuBar
