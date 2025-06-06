import { JSONUtil } from '@/utils/json'

export interface CutItemValue {
  ids: string[]
}

export class CutItemCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type']
  value: CutItemValue
  isReversible: boolean = true

  constructor(prev: JSONObj['type'], value: CutItemValue) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type'] | null> {
    const json = structuredClone(this.prev)
    const { ids } = this.value
    const result = JSONUtil.cutItems(json, ids)
    return new Promise((res) => res(result))
  }

  undo(): Promise<JSONObj['type'] | null> {
    return new Promise((res) => res(this.prev))
  }
}
