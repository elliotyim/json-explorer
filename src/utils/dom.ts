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

  toDOMRect(): DOMRect {
    return new DOMRect(
      Math.min(this.x, this.x + this.magnitudeX),
      Math.min(this.y, this.y + this.magnitudeY),
      Math.abs(this.magnitudeX),
      Math.abs(this.magnitudeY),
    )
  }
}
