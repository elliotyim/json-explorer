import { JSONUtil } from '@/utils/json'

export interface PasteItemValue {
  currentItemId: string
}

export class PasteItemCommand implements Command<JSONObj['type']> {
  prev: JSONObj['type']
  value: PasteItemValue
  isReversible: boolean = true

  constructor(prev: JSONObj['type'], value: PasteItemValue) {
    this.prev = prev
    this.value = value
  }

  execute(): Promise<JSONObj['type'] | null> {
    if (!sessionStorage.getItem('copyPaste')) {
      return new Promise((res) => res([]))
    }

    const json = structuredClone(this.prev)
    const { currentItemId } = this.value
    const result = JSONUtil.pastItems(json, currentItemId)
    return new Promise((res) => res(result))
  }

  undo(): Promise<JSONObj['type'] | null> {
    return new Promise((res) => res(this.prev))
  }
}
