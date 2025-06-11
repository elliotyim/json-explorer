import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BUTTON } from '@/constants/button'
import { useHistory } from '@/hooks/useHistory'
import { useItemAction } from '@/hooks/useItemAction'
import { useHistoryCommandStore } from '@/store/history-command'
import { useCurrentItemStore } from '@/store/item'
import { useEffect, useState } from 'react'
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowTurnDown,
  FaArrowUp,
} from 'react-icons/fa6'

interface Props {
  currentPath: string
}

const MenuBar: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  currentPath,
  ...props
}) => {
  const [inputValue, setInputValue] = useState<string>('')

  const { currentItem } = useCurrentItemStore()
  const { goBackward, goForward, goPrev } = useHistory()
  const { undoList, redoList } = useHistoryCommandStore()
  const { enterItem } = useItemAction()

  useEffect(() => {
    if (currentPath) setInputValue(currentPath)
  }, [currentPath])

  return (
    <div {...props} tabIndex={-1}>
      <div className="flex gap-2">
        <Button
          variant={'outline'}
          disabled={!undoList.length}
          onClick={goBackward}
        >
          <FaArrowLeft size={BUTTON.SIZE} />
        </Button>
        <Button
          variant={'outline'}
          disabled={!redoList.length}
          onClick={goForward}
        >
          <FaArrowRight size={BUTTON.SIZE} />
        </Button>
        <Button
          variant={'outline'}
          disabled={currentItem.id === 'root'}
          onClick={goPrev}
        >
          <FaArrowUp size={BUTTON.SIZE} />
        </Button>
      </div>
      <div className="flex-1">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter' && inputValue) enterItem(inputValue)
          }}
        />
      </div>
      <Button
        variant={'outline'}
        disabled={!inputValue}
        onClick={() => {
          if (inputValue) enterItem(inputValue)
        }}
      >
        <FaArrowTurnDown className="rotate-90" size={BUTTON.SIZE} />
      </Button>
    </div>
  )
}

export default MenuBar
