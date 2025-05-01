export class Deque<T = unknown> {
  private data: Record<number, T> = {}
  private left: number = 0
  private right: number = 1
  private length: number = 0

  constructor(initialData?: []) {
    if (initialData?.length) {
      for (const data of initialData) this.append(data)
    }
  }

  append(value: T) {
    this.data[this.right++] = value
    this.length++
  }

  appendleft(value: T) {
    this.data[this.left--] = value
    this.length++
  }

  pop(): T | undefined {
    if (!this.length) return

    const value = this.data[--this.right]
    delete this.data[this.right]

    this.length--

    return value
  }

  popleft(): T | undefined {
    if (!this.length) return

    const value = this.data[++this.left]
    delete this.data[this.left]

    this.length--

    return value
  }

  peek(): T | undefined {
    if (!this.length) return
    return this.data[this.right - 1]
  }

  peekleft(): T | undefined {
    if (!this.length) return
    return this.data[this.left + 1]
  }

  clear(): void {
    this.data = {}
    this.left = 0
    this.right = 1
    this.length = 0
  }

  size(): number {
    return this.length
  }
}
