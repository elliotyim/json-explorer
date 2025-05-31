import { ITEM } from '@/constants/item'

export class MathUtil {
  static countColumn(width: number) {
    return Math.floor(width / (ITEM.SIZE + ITEM.GAP_SIZE * 2))
  }
}
