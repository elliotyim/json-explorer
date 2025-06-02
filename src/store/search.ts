import { create } from 'zustand'

interface SearchTriggerState {
  isSearchTriggered: boolean
  setIsSearchTriggered: (
    updater: boolean | ((prev: boolean) => boolean),
  ) => void
}

interface SearchKeywordState {
  term: string
  setTerm: (updater: string | ((prev: string) => string)) => void
}

export const useSearchTriggerStore = create<SearchTriggerState>((set) => ({
  isSearchTriggered: false,
  setIsSearchTriggered: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isSearchTriggered: updater(prev.isSearchTriggered) }
        : { isSearchTriggered: updater },
    ),
}))

export const useSearchKeywordState = create<SearchKeywordState>((set) => ({
  term: '',
  setTerm: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { term: updater(prev.term) }
        : { term: updater },
    ),
}))
