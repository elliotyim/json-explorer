import { Deque } from '@/utils/deque'

export class CommandManager {
  undoList = new Deque<Command>()
  redoList = new Deque<Command>()

  async execute(command: Command): Promise<JSONObj['type']> {
    const result = await command.execute()

    if (command.isReversible) {
      this.undoList.push(command)
      this.redoList = new Deque<Command>()
      if (this.undoList.length > 20) this.undoList.popFront()
    }

    return result
  }

  async undo(): Promise<JSONObj['type'] | undefined> {
    if (!this.undoList.length) return

    const command = this.undoList.pop()!
    this.redoList.push(command)

    const result = await command.undo()
    return result
  }

  async redo(): Promise<JSONObj['type'] | undefined> {
    if (!this.redoList.length) return

    const command = this.redoList.pop()!
    this.undoList.push(command)

    const result = await command.execute()
    return result
  }
}
