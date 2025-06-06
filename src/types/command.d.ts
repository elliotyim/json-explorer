interface Command<T = unknown> {
  prev: T
  value: unknown
  isReversible: boolean
  execute: () => Promise<JSONObj['type'] | null>
  undo: () => Promise<JSONObj['type'] | null>
}
