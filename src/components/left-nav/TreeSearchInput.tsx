import { FaMagnifyingGlass } from 'react-icons/fa6'
import { Input } from '@/components/ui/input'
import { useEffect, useRef } from 'react'
import { useSearchKeywordState, useSearchTriggerStore } from '@/store/search'
import { useDebouncedCallback } from 'use-debounce'

const TreeSearchInput = () => {
  const { setTerm } = useSearchKeywordState()
  const { isSearchTriggered, setIsSearchTriggered } = useSearchTriggerStore()

  const debouncedValueChange = useDebouncedCallback((value) => {
    setTerm(value)
  }, 300)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchTriggered) {
      inputRef.current?.focus()
      setIsSearchTriggered(false)
    }
  }, [isSearchTriggered, setIsSearchTriggered])

  return (
    <div
      className="flex w-full items-center gap-2 border-b-2 border-slate-200 px-3 py-2"
      tabIndex={-1}
    >
      <FaMagnifyingGlass size={20} className="flex-shrink-0" />
      <Input
        ref={inputRef}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => debouncedValueChange(e.target.value)}
      />
    </div>
  )
}

export default TreeSearchInput
