import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { FaArrowLeft, FaArrowRight, FaArrowTurnDown } from 'react-icons/fa6'

interface Props {
  currentPath: string
  onInputSubmit?: (currentPath: string) => void
}

const MenuBar: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  currentPath,
  onInputSubmit,
  ...props
}) => {
  const buttonSize = 32
  const [inputValue, setInputValue] = useState<string>('')
  const [back] = useState<string[]>([])
  const [forward] = useState<string[]>([])

  useEffect(() => {
    if (currentPath) setInputValue(currentPath)
  }, [currentPath])

  return (
    <div {...props}>
      <div className="flex gap-2">
        <Button
          variant={'outline'}
          disabled={!back.length}
          onClick={() => {
            if (!back.length) return
          }}
        >
          <FaArrowLeft size={buttonSize} />
        </Button>
        <Button
          variant={'outline'}
          disabled={!forward.length}
          onClick={() => {
            if (!forward.length) return
          }}
        >
          <FaArrowRight size={buttonSize} />
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
          if (!inputValue || !onInputSubmit) return
          onInputSubmit(inputValue)
        }}
      >
        <FaArrowTurnDown className="rotate-90" size={buttonSize} />
      </Button>
    </div>
  )
}

export default MenuBar
