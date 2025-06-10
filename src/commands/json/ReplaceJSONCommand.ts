export class ReplaceJSONCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type']
  value: JSONObj['type']
  isReversible: boolean = true

  constructor(prev: JSONObj['type'], value: JSONObj['type']) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type']> {
    const json = structuredClone(this.value)
    return new Promise((res) => res(json))
  }

  undo(): Promise<JSONObj['type']> {
    return new Promise((res) => res(this.prev))
  }
}
