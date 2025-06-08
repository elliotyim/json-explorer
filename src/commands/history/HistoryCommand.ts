export class HistoryCommand {
  prev: string
  next: string

  constructor(prev: string, next: string) {
    this.prev = prev
    this.next = next
  }

  execute(): string {
    return this.next
  }

  undo(): string {
    return this.prev
  }
}
