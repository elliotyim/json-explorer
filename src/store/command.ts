import { Deque } from '@/utils/deque'
import { create } from 'zustand'

interface CommandStore {
  undoList: Deque<Command>
  redoList: Deque<Command>
  execute: (command: Command) => Promise<JSONObj['type'] | null>
  undo: () => Promise<JSONObj['type'] | null>
  redo: () => Promise<JSONObj['type'] | null>
}

export const useCommandStore = create<CommandStore>((set, get) => ({
  undoList: new Deque<Command>(),
  redoList: new Deque<Command>(),

  execute: async (command) => {
    const result = await command.execute()
    if (command.isReversible) {
      const newUndoList = new Deque<Command>(get().undoList.toArray())
      newUndoList.push(command)
      if (newUndoList.length > 20) newUndoList.popFront()

      set({ undoList: newUndoList, redoList: new Deque<Command>() })
    }
    return result
  },

  undo: async () => {
    const { undoList, redoList } = get()
    if (!undoList.length) return null

    const command = undoList.pop()!
    const newRedoList = new Deque<Command>(redoList.toArray())
    newRedoList.push(command)

    const result = await command.undo()
    set({ undoList, redoList: newRedoList })
    return result
  },

  redo: async () => {
    const { redoList, undoList } = get()
    if (!redoList.length) return null

    const command = redoList.pop()!
    const newUndoList = new Deque<Command>(undoList.toArray())
    newUndoList.push(command)

    const result = await command.execute()
    set({ redoList, undoList: newUndoList })
    return result
  },
}))
