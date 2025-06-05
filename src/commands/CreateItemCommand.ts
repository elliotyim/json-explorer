import { JSONUtil } from '@/utils/json'

export interface CreateItemValue {
  type: Data['type']
  currentItemId: string
}

export class CreateItemCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type'] = {}
  value: CreateItemValue
  isReversible: boolean = true

  constructor(prev: JSONObj['type'], value: CreateItemValue) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type']> {
    const json = structuredClone(this.prev)
    const { currentItemId: id, type } = this.value

    const item = JSONUtil.getByPath(json, id) as JSONObj['type']

    let value
    if (type === 'array') value = []
    else if (type === 'object') value = {}
    else value = null

    if (Array.isArray(item)) item.push(value)
    else item[`new${type}`] = value

    JSONUtil.set({ obj: json, keyPath: id, value: item })
    return new Promise((res) => res(json))
  }

  undo(): Promise<JSONObj['type']> {
    return new Promise((res) => res(this.prev))
  }
}
