export class Deque<T = unknown> {
  private data: Record<number, T> = {}
  private left: number = 0
  private right: number = 1
  private _length: number = 0

  constructor(initialData?: T[]) {
    if (initialData?.length) {
      for (const data of initialData) this.push(data)
    }
  }

  public get length(): number {
    return this._length
  }

  push(value: T) {
    this.data[this.right++] = value
    this._length++
  }

  pushFront(value: T) {
    this.data[this.left--] = value
    this._length++
  }

  pop(): T | undefined {
    if (!this._length) return

    const value = this.data[--this.right]
    delete this.data[this.right]

    this._length--

    return value
  }

  popFront(): T | undefined {
    if (!this._length) return

    const value = this.data[++this.left]
    delete this.data[this.left]

    this._length--

    return value
  }

  peek(): T | undefined {
    if (!this._length) return
    return this.data[this.right - 1]
  }

  peekFront(): T | undefined {
    if (!this._length) return
    return this.data[this.left + 1]
  }

  clear(): void {
    this.data = {}
    this.left = 0
    this.right = 1
    this._length = 0
  }
}
