interface Command<T = unknown> {
  prev: T
  value: unknown
  isReversible: boolean
  execute: () => Promise<JSONObj['type']>
  undo: () => Promise<JSONObj['type']>
}
