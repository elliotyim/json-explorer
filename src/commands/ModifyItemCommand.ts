import { JSONUtil } from '@/utils/json'

export interface ModifyItemValue {
  parentId: string
  id: string
  changedKey: string
  changedValue: string
}

export class ModifyItemCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type']
  value: ModifyItemValue
  isReversible: boolean = true as const

  constructor(prev: JSONObj['type'], value: ModifyItemValue) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type'] | null> {
    const json = structuredClone(this.prev)
    const { parentId, id, changedKey, changedValue } = this.value

    const parent = JSONUtil.getByPath(json, parentId)
    const value = JSON.parse(changedValue)

    let newId
    if (Array.isArray(parent)) {
      newId = JSONUtil.replaceLastKey(id, `[${changedKey}]`)
    } else {
      newId = JSONUtil.replaceLastKey(id, `${changedKey}`)
    }

    if (id !== newId) JSONUtil.remove(parent, id)

    const result = JSONUtil.set({ obj: json, keyPath: newId, value })
    return new Promise((res) => res(result))
  }

  undo(): Promise<JSONObj['type'] | null> {
    return new Promise((res) => res(this.prev))
  }
}
