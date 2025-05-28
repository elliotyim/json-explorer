export class DOMVector {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly magnitudeX: number,
    readonly magnitudeY: number,
  ) {
    this.x = x
    this.y = y
    this.magnitudeX = magnitudeX
    this.magnitudeY = magnitudeY
  }

  getDiagonalLength(): number {
    return Math.sqrt(
      Math.pow(this.magnitudeX, 2) + Math.pow(this.magnitudeY, 2),
    )
  }

  add(vector: DOMVector): DOMVector {
    return new DOMVector(
      this.x + vector.x,
      this.y + vector.y,
      this.magnitudeX + vector.magnitudeX,
      this.magnitudeY + vector.magnitudeY,
    )
  }

  clamp(vector: DOMRect): DOMVector {
    return new DOMVector(
      this.x,
      this.y,
      Math.min(vector.width - this.x, this.magnitudeX),
      Math.min(vector.height - this.y, this.magnitudeY),
    )
  }

  toTerminalPoint(): DOMPoint {
    return new DOMPoint(this.x + this.magnitudeX, this.y + this.magnitudeY)
  }

  toDOMRect(): DOMRect {
    return new DOMRect(
      Math.min(this.x, this.x + this.magnitudeX),
      Math.min(this.y, this.y + this.magnitudeY),
      Math.abs(this.magnitudeX),
      Math.abs(this.magnitudeY),
    )
  }
}

export class DOMUtil {
  static intersect(rect1: DOMRect, rect2: DOMRect): boolean {
    if (rect1.right < rect2.left || rect2.right < rect1.left) return false
    if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) return false
    return true
  }

  static intersectWithPos(x: number, y: number, rect: DOMRect) {
    if (
      rect.x <= x &&
      x <= rect.x + rect.width &&
      rect.y <= y &&
      y <= rect.y + rect.height
    ) {
      return true
    }
    return false
  }

  static generateChildRect(
    containerRect: DOMRect,
    childDiv: HTMLElement,
    childOffsetX: number = 0,
    childOffsetY: number = 0,
  ): DOMRect {
    const itemRect = childDiv.getBoundingClientRect()
    const x = itemRect.x - containerRect.x + childOffsetX
    const y = itemRect.y - containerRect.y + childOffsetY
    const translatedItemRect = new DOMRect(
      x,
      y,
      itemRect.width,
      itemRect.height,
    )

    return translatedItemRect
  }

  static getDivOnPointer(
    pointerX: number,
    pointerY: number,
    containerDiv: HTMLElement,
    offset: number = 0,
  ): HTMLElement | null {
    const containerRect = containerDiv.getBoundingClientRect()

    for (const child of containerDiv.children) {
      const childDiv = child as HTMLDivElement
      const childRect = this.generateChildRect(containerRect, childDiv)

      childRect.x = childRect.x + offset
      childRect.width = childRect.width - offset * 2
      childRect.y = childRect.y + offset
      childRect.height = childRect.height - offset * 2

      if (this.intersectWithPos(pointerX, pointerY, childRect)) return childDiv
    }

    return null
  }

  static getCurrentPoint(
    container: HTMLElement,
    event: PointerEvent,
    offsetX: number = 0,
    offsetY: number = 0,
  ): { x: number; y: number } {
    const containerRect = container.getBoundingClientRect()
    const x = event.clientX - containerRect.x + offsetX
    const y = event.clientY - containerRect.y + offsetY
    return { x, y }
  }

  static getNthFirstChild(
    parent: HTMLElement | null,
    n: number = 0,
  ): HTMLElement | null {
    if (parent == null) return null

    let target = parent
    for (let i = 0; i < n; i++) {
      target = target?.firstElementChild as HTMLElement
    }
    return target
  }

  static getItem(
    point: DOMRect,
    itemAreas: Record<string, DOMRect>,
    itemOffsetX: number = 0,
    itemOffsetY: number = 0,
  ): { id: string; index: number } | null {
    const items = Object.entries(itemAreas).sort(([, a], [, b]) => {
      if (a.y < b.y) return -1
      if (a.y > b.y) return 1
      if (a.x < b.x) return -1
      if (a.x > b.x) return 1
      return 0
    })

    const copiedItems = structuredClone(items)

    for (const i in Object.entries(copiedItems)) {
      const index = +i
      const [id, itemArea] = copiedItems[index]

      itemArea.x += itemOffsetX
      itemArea.width -= itemOffsetX * 2
      itemArea.y += itemOffsetY
      itemArea.height -= itemOffsetY * 2

      if (this.intersect(point, itemArea)) return { id, index }
    }

    return null
  }

  static getItems(
    selectedArea: DOMRect,
    itemAreas: Record<string, DOMRect>,
  ): Record<string, boolean> {
    const next: Record<string, boolean> = {}

    Object.entries(itemAreas).forEach(([id, itemArea]) => {
      if (!this.intersect(selectedArea, itemArea)) return
      next[id] = true
    })

    return next
  }

  static compare(a: DOMRect, b: DOMRect): boolean {
    return (
      a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
    )
  }

  static getNthChild(container: HTMLElement, n: number): Element | null {
    return container?.children?.[n] ?? null
  }
}
