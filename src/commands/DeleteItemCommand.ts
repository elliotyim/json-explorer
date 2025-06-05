import { JSONUtil } from '@/utils/json'

export interface DeleteItemValue {
  ids: string[]
}

export class DeleteItemCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type'] = {}
  value: DeleteItemValue
  isReversible: boolean = true

  constructor(prev: JSONObj['type'], value: DeleteItemValue) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type']> {
    const json = structuredClone(this.prev)
    const result = JSONUtil.deleteItems(json, this.value.ids)
    return new Promise((res) => res(result))
  }

  undo(): Promise<JSONObj['type']> {
    return new Promise((res) => res(this.prev))
  }
}
