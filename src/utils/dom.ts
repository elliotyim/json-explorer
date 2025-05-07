export class DOMVector {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number,
  ) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  toDOMRect(): DOMRect {
    return new DOMRect(
      Math.min(this.x, this.x + this.width),
      Math.min(this.y, this.y + this.height),
      Math.abs(this.width),
      Math.abs(this.height),
    )
  }
}
