import { create } from 'zustand'

interface JsonState {
  json: Record<string, unknown> | unknown[]
  setJson: (json: Record<string, unknown> | unknown[]) => void
}

import fixture from '@/fixtures/sample.json' // Remove this after
export const useJsonStore = create<JsonState>((set) => ({
  json: fixture,
  setJson: (json) => set(() => ({ json })),
}))
