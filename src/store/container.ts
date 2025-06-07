import { create } from 'zustand'

interface ContainerState {
  isContainerReady: boolean
  setIsContainerReady: (updater: boolean | ((prev: boolean) => boolean)) => void
}

export const useContainerStore = create<ContainerState>((set) => ({
  isContainerReady: false,
  setIsContainerReady: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { isContainerReady: updater(prev.isContainerReady) }
        : { isContainerReady: updater },
    ),
}))

interface MainContainerState {
  container: HTMLElement | null
  setContainer: (
    updater:
      | HTMLElement
      | null
      | ((prev: HTMLElement | null) => HTMLElement | null),
  ) => void
}

export const useMainContainerStore = create<MainContainerState>((set) => ({
  container: null,
  setContainer: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { container: updater(prev.container) }
        : { container: updater },
    ),
}))

interface ScrollContainerState {
  scrollContainer: HTMLElement | null
  setScrollContainer: (
    updater:
      | HTMLElement
      | null
      | ((prev: HTMLElement | null) => HTMLElement | null),
  ) => void
}

export const useScrollContainerStore = create<ScrollContainerState>((set) => ({
  scrollContainer: null,
  setScrollContainer: (updater) =>
    set((prev) =>
      typeof updater === 'function'
        ? { scrollContainer: updater(prev.scrollContainer) }
        : { scrollContainer: updater },
    ),
}))
