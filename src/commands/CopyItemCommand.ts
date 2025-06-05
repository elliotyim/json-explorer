import { JSONUtil } from '@/utils/json'

export interface CopyItemValue {
  ids: string[]
}

export class CopyItemCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type']
  value: CopyItemValue
  isReversible: boolean = false

  constructor(prev: JSONObj['type'], value: CopyItemValue) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type']> {
    const json = structuredClone(this.prev)
    const { ids } = this.value
    JSONUtil.copyItems(json, ids)
    return new Promise((res) => res({}))
  }
  undo(): Promise<JSONObj['type']> {
    throw Error("This method shouldn't be called!")
  }
}
