import { create } from 'zustand'
import pokemon from '@/fixtures/pokomen.json'

interface JsonState {
  json: Record<string, unknown> | unknown[]
  setJson: (json: Record<string, unknown> | unknown[]) => void
}

export const useJsonStore = create<JsonState>((set) => ({
  json: pokemon,
  setJson: (json) => set(() => ({ json })),
}))
