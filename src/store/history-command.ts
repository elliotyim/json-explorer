import { HistoryCommand } from '@/commands/HistoryCommand'
import { create } from 'zustand'

interface HistoryCommandStore {
  undoList: HistoryCommand[]
  redoList: HistoryCommand[]
  execute: (command: HistoryCommand) => string
  undo: () => string | undefined
  redo: () => string | undefined
}

export const useHistoryCommandStore = create<HistoryCommandStore>(
  (set, get) => ({
    undoList: [],
    redoList: [],
    execute(command) {
      const path = command.execute()
      const newUndoList = [...get().undoList, command]
      set({ undoList: newUndoList, redoList: [] })
      return path
    },
    undo() {
      const { undoList, redoList } = get()
      if (!undoList.length) return

      const command = undoList.pop()!
      const path = command.undo()

      const newRedoList = [...redoList, command]
      set({ undoList, redoList: newRedoList })
      return path
    },
    redo() {
      const { redoList, undoList } = get()
      if (!redoList.length) return

      const command = redoList.pop()!
      const path = command.execute()

      const newUndoList = [...undoList, command]
      set({ redoList, undoList: newUndoList })
      return path
    },
  }),
)
