import { create } from 'zustand'

interface JsonState {
  json: Record<string, unknown> | unknown[]
  setJson: (json: Record<string, unknown> | unknown[]) => void
}

export const useJsonStore = create<JsonState>((set) => ({
  json: {
    key: 'value',
    array: ['value2', 'value3'],
    object: { key2: 'value4' },
  },
  setJson: (json) => set(() => ({ json })),
}))
