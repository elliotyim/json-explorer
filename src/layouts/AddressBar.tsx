import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BUTTON } from '@/constants/button'
import { useHistory } from '@/hooks/useHistory'
import { useBackHistoryStore, useForwardHistoryStore } from '@/store/history'
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
  onInputSubmit?: (currentPath: string) => void
}

const MenuBar: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  currentPath,
  onInputSubmit,
  ...props
}) => {
  const [inputValue, setInputValue] = useState<string>('')

  const { currentItem } = useCurrentItemStore()

  const { backHistories } = useBackHistoryStore()
  const { forwardHistories } = useForwardHistoryStore()

  const { goBackward, goForward, goPrev } = useHistory()

  useEffect(() => {
    if (currentPath) setInputValue(currentPath)
  }, [currentPath])

  return (
    <div {...props}>
      <div className="flex gap-2">
        <Button
          variant={'outline'}
          disabled={!backHistories.length}
          onClick={goBackward}
        >
          <FaArrowLeft size={BUTTON.SIZE} />
        </Button>
        <Button
          variant={'outline'}
          disabled={!forwardHistories.length}
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
