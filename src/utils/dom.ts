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
    selectInner?: boolean,
  ): HTMLElement | null {
    const containerRect = containerDiv.getBoundingClientRect()

    for (const child of containerDiv.children) {
      const childDiv = (
        selectInner ? child.firstElementChild : child
      ) as HTMLElement
      const childRect = this.generateChildRect(containerRect, childDiv)

      if (this.intersectWithPos(pointerX, pointerY, childRect)) return childDiv
    }

    return null
  }

  static getCurrentPoint(e: React.PointerEvent): { x: number; y: number } {
    const containerRect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - containerRect.x
    const y = e.clientY - containerRect.y
    return { x, y }
  }
}
